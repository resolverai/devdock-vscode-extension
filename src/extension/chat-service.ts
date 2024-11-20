import {
  StatusBarItem,
  WebviewView,
  commands,
  window,
  workspace,
  ExtensionContext,
  languages,
  DiagnosticSeverity,
} from "vscode";
import * as path from "path";
import * as fs from "fs/promises";

import {
  ACTIVE_CHAT_PROVIDER_STORAGE_KEY,
  DEFAULT_RELEVANT_CODE_COUNT,
  DEFAULT_RELEVANT_FILE_COUNT,
  DEFAULT_RERANK_THRESHOLD,
  DEFAULT_VECTOR_SEARCH_METRIC,
  EVENT_NAME,
  EXTENSION_CONTEXT_NAME,
  EXTENSION_SESSION_NAME,
  SYMMETRY_EMITTER_KEY,
  SYSTEM,
  USER,
  WEBUI_TABS,
} from "../common/constants";
import {
  StreamResponse,
  RequestBodyBase,
  ServerMessage,
  TemplateData,
  Message,
  StreamRequestOptions,
} from "../common/types";
import {
  getChatDataFromProvider,
  getLanguage,
  updateLoadingMessage,
} from "./utils";
import { CodeLanguageDetails } from "../common/languages";
import { TemplateProvider } from "./template-provider";
import { streamResponse } from "./stream";
import { createStreamRequestBody } from "./provider-options";
import { kebabToSentence } from "../webview/utils";
import { DevdockProvider } from "./provider-manager";
import { EmbeddingDatabase } from "./embeddings";
import { Reranker } from "./reranker";
import { SymmetryService } from "./symmetry-service";
import { Logger } from "../common/logger";
import { SessionManager } from "./session-manager";
import { DevdockPoints, PointsEvents } from "../common/devdockPoints";
import { apiProviders } from "../common/types";

const logger = new Logger();
type BotData = {
  bot_id: string;
  api_key: string;
  domain: string;
  uri: string;
  header_key: string;
  chain: string;
  protocal: string;
  portNumber: number;
};

export class ChatService {
  private _completion = "";
  private _config = workspace.getConfiguration("devdock");
  private _context?: ExtensionContext;
  private _controller?: AbortController;
  private _db?: EmbeddingDatabase;
  private _keepAlive = this._config.get("keepAlive") as string | number;
  private _numPredictChat = this._config.get("numPredictChat") as number;
  private _promptTemplate = "";
  private _reranker: Reranker;
  private _statusBar: StatusBarItem;
  private _symmetryService?: SymmetryService;
  private _temperature = this._config.get("temperature") as number;
  private _templateProvider?: TemplateProvider;
  private _view?: WebviewView;
  private _sessionManager: SessionManager;

  constructor(
    statusBar: StatusBarItem,
    templateDir: string,
    extensionContext: ExtensionContext,
    view: WebviewView,
    db: EmbeddingDatabase | undefined,
    sessionManager: SessionManager,
    symmetryService: SymmetryService
  ) {
    this._view = view;
    this._statusBar = statusBar;
    this._templateProvider = new TemplateProvider(templateDir);
    this._reranker = new Reranker();
    this._context = extensionContext;
    this._db = db;
    this._sessionManager = sessionManager;
    this._symmetryService = symmetryService;
    workspace.onDidChangeConfiguration((event) => {
      if (!event.affectsConfiguration("devdock")) {
        return;
      }
      this.updateConfig();
    });

    this.setupSymmetryListeners();
  }

  private setupSymmetryListeners() {
    this._symmetryService?.on(
      SYMMETRY_EMITTER_KEY.inference,
      (completion: string) => {
        this._view?.webview.postMessage({
          type: EVENT_NAME.devdockOnCompletion,
          value: {
            completion: completion.trimStart(),
            data: getLanguage(),
          },
        } as ServerMessage);
      }
    );
  }

  private async getRelevantFiles(
    text: string | undefined
  ): Promise<[string, number][]> {
    if (!this._db || !text || !workspace.name) return [];

    const table = `${workspace.name}-file-paths`;
    if (await this._db.hasEmbeddingTable(table)) {
      const embedding = await this._db.fetchModelEmbedding(text);

      if (!embedding) return [];

      const relevantFileCountContext = `${EVENT_NAME.devdockGlobalContext}-${EXTENSION_CONTEXT_NAME.devdockRelevantFilePaths}`;
      const stored = this._context?.globalState.get(
        relevantFileCountContext
      ) as number;
      const relevantFileCount = Number(stored) || DEFAULT_RELEVANT_FILE_COUNT;

      const storedMetric = this._context?.globalState.get(
        `${EVENT_NAME.devdockGlobalContext}-${EXTENSION_CONTEXT_NAME.devdockVectorSearchMetric}`
      ) as number;

      const metric = storedMetric || DEFAULT_VECTOR_SEARCH_METRIC;

      const filePaths =
        (await this._db.getDocuments(
          embedding,
          relevantFileCount,
          table,
          metric as "cosine" | "l2" | "dot"
        )) || [];

      if (!filePaths.length) return [];

      return this.rerankFiles(
        text,
        filePaths.map((f) => f.content)
      );
    }

    return [];
  }

  private getRerankThreshold() {
    const rerankThresholdContext = `${EVENT_NAME.devdockGlobalContext}-${EXTENSION_CONTEXT_NAME.devdockRerankThreshold}`;
    const stored = this._context?.globalState.get(
      rerankThresholdContext
    ) as number;
    const rerankThreshold = stored || DEFAULT_RERANK_THRESHOLD;

    return rerankThreshold;
  }

  private async rerankFiles(
    text: string | undefined,
    filePaths: string[] | undefined
  ) {
    if (!this._db || !text || !workspace.name || !filePaths?.length) return [];

    const rerankThreshold = this.getRerankThreshold();

    logger.log(
      `
      Reranking threshold: ${rerankThreshold}
    `.trim()
    );

    const fileNames = filePaths?.map((filePath) => path.basename(filePath));

    const scores = await this._reranker.rerank(text, fileNames);

    if (!scores) return [];

    const fileScorePairs: [string, number][] = filePaths.map(
      (filePath, index) => {
        return [filePath, scores[index]];
      }
    );

    return fileScorePairs;
  }

  private async readFileContent(
    filePath: string | undefined,
    maxFileSize: number = 5 * 1024
  ): Promise<string | null> {
    if (!filePath) return null;

    try {
      const stats = await fs.stat(filePath);

      if (stats.size > maxFileSize) {
        return null;
      }

      if (stats.size === 0) {
        return "";
      }

      const content = await fs.readFile(filePath, "utf-8");
      return content;
    } catch (error) {
      return null;
    }
  }

  private async getRelevantCode(
    text: string | undefined,
    relevantFiles: [string, number][]
  ): Promise<string> {
    if (!this._db || !text || !workspace.name) return "";

    const table = `${workspace.name}-documents`;
    const rerankThreshold = this.getRerankThreshold();

    if (await this._db.hasEmbeddingTable(table)) {
      const relevantCodeCountContext = `${EVENT_NAME.devdockGlobalContext}-${EXTENSION_CONTEXT_NAME.devdockRelevantCodeSnippets}`;
      const stored = this._context?.globalState.get(
        relevantCodeCountContext
      ) as number;
      const relevantCodeCount = Number(stored) || DEFAULT_RELEVANT_CODE_COUNT;

      const embedding = await this._db.fetchModelEmbedding(text);

      if (!embedding) return "";

      const storedMetric = this._context?.globalState.get(
        `${EVENT_NAME.devdockGlobalContext}-${EXTENSION_CONTEXT_NAME.devdockVectorSearchMetric}`
      ) as number;
      const metric = storedMetric || DEFAULT_VECTOR_SEARCH_METRIC;

      const query = relevantFiles?.length
        ? `file IN ("${relevantFiles.map((file) => file[0]).join('","')}")`
        : "";

      const queryEmbeddedDocuments =
        (await this._db.getDocuments(
          embedding,
          Math.round(relevantCodeCount / 2),
          table,
          metric as "cosine" | "l2" | "dot",
          query
        )) || [];

      const embeddedDocuments =
        (await this._db.getDocuments(
          embedding,
          Math.round(relevantCodeCount / 2),
          table,
          metric as "cosine" | "l2" | "dot"
        )) || [];

      const documents = [...embeddedDocuments, ...queryEmbeddedDocuments];

      const documentScores = await this._reranker.rerank(
        text,
        documents.map((item) => (item.content ? item.content.trim() : ""))
      );

      if (!documentScores) return "";

      const readThreshould = rerankThreshold;

      const readFileChunks = [];

      for (let i = 0; i < relevantFiles.length; i++) {
        if (relevantFiles[i][1] > readThreshould) {
          try {
            const fileContent = await this.readFileContent(relevantFiles[i][0]);
            readFileChunks.push(fileContent);
          } catch (error) {
            console.error(`Error reading file ${relevantFiles[i][0]}:`, error);
          }
        }
      }

      const documentChunks = documents
        .filter((_, index) => documentScores[index] > rerankThreshold)
        .map(({ content }) => content);

      return [readFileChunks.filter(Boolean), documentChunks.filter(Boolean)]
        .join("\n\n")
        .trim();
    }

    return "";
  }

  // private getProvider = () => {
  //   const provider = this._context?.globalState.get<DevdockProvider>(
  //     ACTIVE_CHAT_PROVIDER_STORAGE_KEY
  //   );

  //   return provider;
  // };

  private getProvider = (): DevdockProvider | undefined => {
    // Retrieve BotData from global state
    const myProvider = this._context?.globalState.get<BotData>(
      "devDockProviderBasedOnUserQuery"
    );

    if (!myProvider) {
      return undefined; // Return undefined if myProvider is not found
    }

    // Map BotData to DevdockProvider
    const provider: DevdockProvider = {
      apiHostname: myProvider.domain,
      apiPath: myProvider.uri,
      apiPort: myProvider.portNumber,
      apiProtocol: "https", // Note: Ensure correct spelling of "protocol" in the source
      id: myProvider.bot_id,
      label: `Provider for ${myProvider.bot_id}`, // You can adjust this mapping as needed
      modelName: "DefaultModel", // Set a default value or derive from myProvider if applicable
      provider: apiProviders.devDockProvider,
      type: myProvider.chain,
      apiKey: myProvider.api_key,
      fimTemplate: undefined, // Set a default or derive if applicable
    };

    return provider;
  };

  private buildStreamRequest(messages?: Message[] | Message[]) {
    const myProvider = this._context?.globalState.get(
      "devDockProviderBasedOnUserQuery"
    ) as BotData;

    if (myProvider != undefined) {
      const requestOptions: StreamRequestOptions = {
        hostname: myProvider.domain,
        port: 443,
        path: myProvider.uri,
        protocol: "https",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${myProvider.api_key}`,
          "x-api-key": myProvider.api_key,
        },
      };
      let myMessages: any = undefined;
      if (messages && messages?.length > 0) {
        myMessages = this.updateMessagesForDevDockProvider(messages);
      }
      // myMessages = this.updateMessagesForDevDockProvider();
      const requestBody: RequestBodyBase = {
        message:
          myMessages && myMessages.length > 0
            ? myMessages[myMessages.length - 1].content
            : "",
        history:
          myMessages && myMessages.length > 1
            ? myMessages.slice(0, myMessages.length - 1)
            : [],
        stream: true,
      };
      return { requestOptions, requestBody };
    } else {
      console.log(
        "buildStreamRequest chat-service.ts error myProvider undefined"
      );
    }

    // return { requestOptions, requestBody };
  }

  public updateMessagesForDevDockProvider(messages: Message[]): Message[] {
    console.log("updateMessagesForDevDockProvider", JSON.stringify(messages));
    return messages
      .filter((message) => {
        return message.role !== "system";
      })
      .map((message) => {
        const updatedMessage = { ...message, text: message.content };
        // delete updatedMessage.content;

        if (message.role === "user") {
          return { ...updatedMessage, role: "human" };
        } else if (message.role === "assistant") {
          return { ...updatedMessage, role: "ai" };
        }
        return updatedMessage;
      });
  }

  private onStreamData = (
    streamResponse: StreamResponse,
    onEnd?: (completion: string) => void
  ) => {
    const provider = this.getProvider();
    if (!provider) return;
    if (!streamResponse) {
      console.log("response is not parseable", streamResponse);
      return;
    }

    try {
      const data = getChatDataFromProvider(provider.provider, streamResponse);
      this._completion = this._completion + data;
      if (onEnd) return;
      this._view?.webview.postMessage({
        type: EVENT_NAME.devdockOnCompletion,
        value: {
          completion: this._completion.trimStart(),
          data: getLanguage(),
          type: this._promptTemplate,
        },
      } as ServerMessage);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return;
    }
  };

  private onStreamEnd = (onEnd?: (completion: string) => void) => {
    this._statusBar.text = "🤖";
    commands.executeCommand(
      "setContext",
      EXTENSION_CONTEXT_NAME.devdockGeneratingText,
      false
    );

    if (onEnd) {
      onEnd(this._completion);
      this._view?.webview.postMessage({
        type: EVENT_NAME.devdockOnEnd,
      } as ServerMessage);
      return;
    }
    this._view?.webview.postMessage({
      type: EVENT_NAME.devdockOnEnd,
      value: {
        completion: this._completion.trimStart(),
        data: getLanguage(),
        type: this._promptTemplate,
      },
    } as ServerMessage);
  };

  private onStreamError = (error: Error) => {
    this._view?.webview.postMessage({
      type: EVENT_NAME.devdockOnEnd,
      value: {
        error: true,
        errorMessage: error.message,
      },
    } as ServerMessage);
  };

  private onStreamStart = (controller?: AbortController) => {
    this._controller = controller;
    commands.executeCommand(
      "setContext",
      EXTENSION_CONTEXT_NAME.devdockGeneratingText,
      true
    );
    this._view?.webview.onDidReceiveMessage((data: { type: string }) => {
      if (data.type === EVENT_NAME.devdockStopGeneration) {
        this._controller?.abort();
      }
    });
  };

  public destroyStream = () => {
    this._controller?.abort();
    this._statusBar.text = "🤖";
    commands.executeCommand(
      "setContext",
      EXTENSION_CONTEXT_NAME.devdockGeneratingText,
      true
    );
    this._view?.webview.postMessage({
      type: EVENT_NAME.devdockOnEnd,
      value: {
        completion: this._completion.trimStart(),
        data: getLanguage(),
        type: this._promptTemplate,
      },
    } as ServerMessage);
  };

  private buildTemplatePrompt = async (
    template: string,
    language: CodeLanguageDetails,
    context?: string
  ) => {
    const editor = window.activeTextEditor;
    const selection = editor?.selection;
    const selectionContext =
      editor?.document.getText(selection) || context || "";

    const prompt = await this._templateProvider?.readTemplate<TemplateData>(
      template,
      {
        code: selectionContext || "",
        language: language?.langName || "unknown",
      }
    );
    return { prompt: prompt || "", selection: selectionContext };
  };

  private streamResponse({
    requestBody,
    requestOptions,
    onEnd,
  }: {
    requestBody: RequestBodyBase;
    requestOptions: StreamRequestOptions;
    onEnd?: (completion: string) => void;
  }) {
    return streamResponse({
      body: requestBody,
      options: requestOptions,
      onData: (streamResponse) =>
        this.onStreamData(streamResponse as StreamResponse, onEnd),
      onEnd: () => this.onStreamEnd(onEnd),
      onStart: this.onStreamStart,
      onError: this.onStreamError,
    });
  }

  private sendEditorLanguage = () => {
    this._view?.webview.postMessage({
      type: EVENT_NAME.devdockSendLanguage,
      value: {
        data: getLanguage(),
      },
    } as ServerMessage);
  };

  private focusChatTab = () => {
    this._view?.webview.postMessage({
      type: EVENT_NAME.devdockSetTab,
      value: {
        data: WEBUI_TABS.chat,
      },
    } as ServerMessage<string>);
  };

  getProblemsContext(): string {
    const problems = workspace.textDocuments
      .flatMap((document) =>
        languages.getDiagnostics(document.uri).map((diagnostic) => ({
          severity: DiagnosticSeverity[diagnostic.severity],
          message: diagnostic.message,
          code: document.getText(diagnostic.range),
          line: document.lineAt(diagnostic.range.start.line).text,
          lineNumber: diagnostic.range.start.line + 1,
          character: diagnostic.range.start.character + 1,
          source: diagnostic.source,
          diagnosticCode: diagnostic.code,
        }))
      )
      .map((problem) => JSON.stringify(problem))
      .join("\n");

    return problems;
  }

  public async getRagContext(text?: string): Promise<string | null> {
    const symmetryConnected = this._sessionManager?.get(
      EXTENSION_SESSION_NAME.devdockSymmetryConnection
    );

    let combinedContext = "";

    const workspaceMentioned = text?.includes("@workspace");

    const problemsMentioned = text?.includes("@problems");

    const ragContextKey = `${EVENT_NAME.devdockWorkspaceContext}-${EXTENSION_CONTEXT_NAME.devdockEnableRag}`;
    const isRagEnabled = this._context?.workspaceState.get(ragContextKey);

    if (symmetryConnected) return null;

    let problemsContext = "";

    if (problemsMentioned) {
      problemsContext = this.getProblemsContext();
      if (problemsContext) combinedContext += problemsContext + "\n\n";
    }

    const prompt = text?.replace(/@workspace|@problems/g, "");

    let relevantFiles: [string, number][] | null = [];
    let relevantCode: string | null = "";

    if (workspaceMentioned || isRagEnabled) {
      updateLoadingMessage(this._view, "Exploring knowledge base");
      relevantFiles = await this.getRelevantFiles(prompt);
      relevantCode = await this.getRelevantCode(prompt, relevantFiles);
    }

    if (relevantFiles?.length) {
      const filesTemplate =
        await this._templateProvider?.readTemplate<TemplateData>(
          "relevant-files",
          { code: relevantFiles.map((file) => file[0]).join(", ") }
        );
      combinedContext += filesTemplate + "\n\n";
    }

    if (relevantCode) {
      const codeTemplate =
        await this._templateProvider?.readTemplate<TemplateData>(
          "relevant-code",
          { code: relevantCode }
        );
      combinedContext += codeTemplate;
    }

    return combinedContext.trim() || null;
  }

  public async streamChatCompletion(messages: Message[]) {
    this._completion = "";
    this.sendEditorLanguage();
    const editor = window.activeTextEditor;
    const selection = editor?.selection;
    const userSelection = editor?.document.getText(selection);
    const lastMessage = messages[messages.length - 1];
    const isFileInFocus = lastMessage.isInFocusFile;
    // console.log("streamChatCompletion isFileInFocus", isFileInFocus);
    const fileData = isFileInFocus ? editor?.document.getText() : "";

    const text = lastMessage.content;

    const systemMessage = {
      role: SYSTEM,
      content: await this._templateProvider?.readSystemMessageTemplate(
        this._promptTemplate
      ),
    };

    let additionalContext = "";

    if (userSelection) {
      additionalContext += `Selected Code:\n${userSelection}\n\n`;
    }
    if (isFileInFocus && fileData) {
      console.log(
        "streamChatCompletion isFileInFocus",
        isFileInFocus,
        fileData
      );
      additionalContext += `Attached file content:\n${fileData}\n\n`;
    }

    const ragContext = await this.getRagContext(text);

    const cleanedText = text?.replace(/@workspace/g, "").trim();

    if (ragContext) {
      additionalContext += `Additional Context:\n${ragContext}\n\n`;
    }

    const updatedMessages = [systemMessage, ...messages.slice(0, -1)];

    if (additionalContext) {
      const lastMessageContent = `${cleanedText}\n\n${additionalContext.trim()}`;
      updatedMessages.push({
        role: USER,
        content: lastMessageContent,
      });
    } else {
      updatedMessages.push({
        ...lastMessage,
        content: cleanedText,
      });
    }
    updateLoadingMessage(this._view, "Thinking");
    const myMessage = this.updateMessagesForDevDockProvider(updatedMessages);
    const request = this.buildStreamRequest(myMessage);
    if (!request) return;
    const { requestBody, requestOptions } = request;

    if (requestBody) {
      console.log("Request", requestBody, "requestOptions", requestOptions);
      return this.streamResponse({ requestBody, requestOptions });
    } else {
      console.log(
        "Request or requestOptions is undefined in streamChatCompletion"
      );
      // Handle the case when requestBody is undefined
      // You can throw an error, log a message, or return a default value
    }
  }

  public async streamBountyCompletion(
    messages: Message[],
    onEnd?: (completion: string) => void
  ) {
    this._completion = "";

    const lastMessage = messages[messages.length - 1];
    // console.log("streamChatCompletion isFileInFocus", isFileInFocus);

    const text = lastMessage.content;

    const systemMessage = {
      role: SYSTEM,
      content: await this._templateProvider?.readSystemMessageTemplate(
        this._promptTemplate
      ),
    };

    const chatGPTResponseForSrcFiles = [
      {
        filename: "File1.js",
        content: 'console.log("Hello World");',
      },
      {
        filename: "File2.js",
        content: 'console.log("Goodbye World");',
      },
    ];
    const expectedJsonResponseString = JSON.stringify(
      chatGPTResponseForSrcFiles
    );

    let additionalContext =
      "Provide me a response in a way where if in your response there is any code snippet is available then provide me a json response like this - " +
      expectedJsonResponseString +
      "\n\n" +
      "\n Generate all relevant source files for the project which are required for a web3 project development, along with basic setup of code snippets";

    const ragContext = await this.getRagContext(text);

    const cleanedText = text?.replace(/@workspace/g, "").trim();

    if (ragContext) {
      additionalContext += `Additional Context:\n${ragContext}\n\n`;
    }

    const updatedMessages = [systemMessage, ...messages.slice(0, -1)];

    if (additionalContext) {
      const lastMessageContent = `${cleanedText}\n\n${additionalContext.trim()}`;
      updatedMessages.push({
        role: USER,
        content: lastMessageContent,
      });
    } else {
      updatedMessages.push({
        ...lastMessage,
        content: cleanedText,
      });
    }
    updateLoadingMessage(this._view, "Thinking"); //this is view for showing loader
    const myMessage = this.updateMessagesForDevDockProvider(updatedMessages);
    const request = this.buildStreamRequest(myMessage);
    if (!request) return;
    const { requestBody, requestOptions } = request;
    if (requestBody) {
      console.log("Request", requestBody, "requestOptions", requestOptions);
      return this.streamResponse({ requestBody, requestOptions, onEnd });
    } else {
      console.log(
        "Request or requestOptions is undefined in streamBountyCompletion"
      );
      // Handle the case when requestBody is undefined
      // You can throw an error, log a message, or return a default value
    }
  }

  public async getTemplateMessages(
    template: string,
    context?: string,
    skipMessage?: boolean
  ): Promise<Message[]> {
    this._statusBar.text = "$(loading~spin)";
    const { language } = getLanguage();
    this._completion = "";
    this._promptTemplate = template;
    this.sendEditorLanguage();

    const { prompt, selection } = await this.buildTemplatePrompt(
      template,
      language,
      context
    );

    if (!skipMessage) {
      this.focusChatTab();
      this._view?.webview.postMessage({
        type: EVENT_NAME.devdockOnLoading,
      });
      this._view?.webview.postMessage({
        type: EVENT_NAME.twinngAddMessage,
        value: {
          completion: kebabToSentence(template) + "\n\n" + "```\n" + selection,
          data: getLanguage(),
        },
      } as ServerMessage);
    }

    const systemMessage = {
      role: SYSTEM,
      content: await this._templateProvider?.readSystemMessageTemplate(
        this._promptTemplate
      ),
    };

    let ragContext = undefined;

    if (["explain"].includes(template)) {
      ragContext = await this.getRagContext(selection);
    }

    const userContent = ragContext
      ? `${prompt}\n\nAdditional Context:\n${ragContext}`
      : prompt;

    const conversation: Message[] = [
      systemMessage,
      {
        role: USER,
        content: userContent,
      },
    ];

    return conversation;
  }

  public async streamTemplateCompletion(
    promptTemplate: string,
    context?: string,
    onEnd?: (completion: string) => void,
    skipMessage?: boolean
  ) {
    const messages = await this.getTemplateMessages(
      promptTemplate,
      context,
      skipMessage
    );
    const myMessage = this.updateMessagesForDevDockProvider(messages);
    const request = this.buildStreamRequest(myMessage);

    if (!request) return;
    const { requestBody, requestOptions } = request;

    if (requestBody) {
      console.log("Request", requestBody, "requestOptions", requestOptions);
      return this.streamResponse({ requestBody, requestOptions, onEnd });
    } else {
      console.log(
        "Request or requestOptions is undefined in streamTemplateCompletion"
      );
      // Handle the case when requestBody is undefined
      // You can throw an error, log a message, or return a default value
    }
  }

  private updateConfig() {
    this._config = workspace.getConfiguration("devdock");
    this._temperature = this._config.get("temperature") as number;
    this._keepAlive = this._config.get("keepAlive") as string | number;
  }
}
