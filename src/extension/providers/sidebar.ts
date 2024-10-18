import * as vscode from "vscode";

import {
  createSymmetryMessage,
  getGitChanges,
  getLanguage,
  getTextSelection,
  getTheme,
  updateLoadingMessage,
} from "../utils";
import {
  WORKSPACE_STORAGE_KEY,
  EXTENSION_SESSION_NAME,
  EVENT_NAME,
  DEVDOCK_COMMAND_NAME,
  SYMMETRY_DATA_MESSAGE,
  SYMMETRY_EMITTER_KEY,
  SYSTEM,
  LOGIN_EVENT_NAME,
} from "../../common/constants";
import { ChatService } from "../chat-service";
import {
  ClientMessage,
  Message,
  ApiModel,
  ServerMessage,
  InferenceRequest,
} from "../../common/types";
import { TemplateProvider } from "../template-provider";
import { OllamaService } from "../ollama-service";
import { ProviderManager } from "../provider-manager";
import { ConversationHistory } from "../conversation-history";
import { EmbeddingDatabase } from "../embeddings";
import { SymmetryService } from "../symmetry-service";
import { SessionManager } from "../session-manager";
import { Logger } from "../../common/logger";
import analytics from "../../common/analytics";

const logger = new Logger();

export class SidebarProvider implements vscode.WebviewViewProvider {
  private _config = vscode.workspace.getConfiguration("devdock");
  private _context: vscode.ExtensionContext;
  private _statusBar: vscode.StatusBarItem;
  private _templateDir: string;
  private _templateProvider: TemplateProvider;
  private _ollamaService: OllamaService | undefined = undefined;
  public conversationHistory: ConversationHistory | undefined = undefined;
  public chatService: ChatService | undefined = undefined;
  public view?: vscode.WebviewView;
  private _db: EmbeddingDatabase | undefined;
  public symmetryService?: SymmetryService | undefined;
  private _sessionManager: SessionManager;

  constructor(
    statusBar: vscode.StatusBarItem,
    context: vscode.ExtensionContext,
    templateDir: string,
    db: EmbeddingDatabase | undefined,
    sessionManager: SessionManager
  ) {
    this._statusBar = statusBar;
    this._context = context;
    this._templateDir = templateDir;
    this._sessionManager = sessionManager;
    this._templateProvider = new TemplateProvider(templateDir);
    this._ollamaService = new OllamaService();
    if (db) {
      this._db = db;
    }
    return this;
  }

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this.view = webviewView;

    this.symmetryService = new SymmetryService(
      this.view,
      this._sessionManager,
      this._context
    );

    this.chatService = new ChatService(
      this._statusBar,
      this._templateDir,
      this._context,
      webviewView,
      this._db,
      this._sessionManager,
      this.symmetryService
    );

    this.conversationHistory = new ConversationHistory(
      this._context,
      this.view,
      this._sessionManager,
      this.symmetryService
    );

    new ProviderManager(this._context, this.view);

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._context?.extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    vscode.window.onDidChangeTextEditorSelection(
      (event: vscode.TextEditorSelectionChangeEvent) => {
        const text = event.textEditor.document.getText(event.selections[0]);
        webviewView.webview.postMessage({
          type: EVENT_NAME.devdockTextSelection,
          value: {
            type: WORKSPACE_STORAGE_KEY.selection,
            completion: text,
          },
        });
      }
    );

    vscode.window.onDidChangeActiveColorTheme(() => {
      webviewView.webview.postMessage({
        type: EVENT_NAME.devdockSendTheme,
        value: {
          data: getTheme(),
        },
      });
    });

    webviewView.webview.onDidReceiveMessage((message) => {
      const eventHandlers = {
        [EVENT_NAME.devdockAcceptSolution]: this.acceptSolution,
        [EVENT_NAME.devdockChatMessage]: this.streamChatCompletion,
        [EVENT_NAME.devdockBountyRequest]: this.streamBountyRequestCompletion,

        [EVENT_NAME.devdockClickSuggestion]: this.clickSuggestion,
        [EVENT_NAME.devdockFetchOllamaModels]: this.fetchOllamaModels,
        [EVENT_NAME.devdockGlobalContext]: this.getGlobalContext,
        [EVENT_NAME.devdockListTemplates]: this.listTemplates,
        [EVENT_NAME.devdockSetTab]: this.setTab,
        [DEVDOCK_COMMAND_NAME.settings]: this.openSettings,
        [EVENT_NAME.devdockNewDocument]: this.createNewUntitledDocument,
        [EVENT_NAME.devdockNotification]: this.sendNotification,
        [EVENT_NAME.devdockSendLanguage]: this.getCurrentLanguage,
        [EVENT_NAME.devdockSendTheme]: this.getTheme,
        [EVENT_NAME.devdockSetGlobalContext]: this.setGlobalContext,
        [EVENT_NAME.devdockSetWorkspaceContext]: this.setWorkspaceContext,
        [EVENT_NAME.devdockTextSelection]: this.getSelectedText,
        [EVENT_NAME.devdockWorkspaceContext]: this.getDevdockWorkspaceContext,
        [EVENT_NAME.devdockSetConfigValue]: this.setConfigurationValue,
        [EVENT_NAME.devdockGetConfigValue]: this.getConfigurationValue,
        [EVENT_NAME.devdockGetGitChanges]: this.getGitCommitMessage,
        [EVENT_NAME.devdockHideBackButton]: this.devdockHideBackButton,
        [EVENT_NAME.devdockEmbedDocuments]: this.embedDocuments,
        [EVENT_NAME.devdockConnectSymmetry]: this.connectToSymmetry,
        [EVENT_NAME.devdockDisconnectSymmetry]: this.disconnectSymmetry,
        [EVENT_NAME.devdockSessionContext]: this.getSessionContext,
        [EVENT_NAME.devdockStartSymmetryProvider]: this.createSymmetryProvider,
        [EVENT_NAME.devdockStopSymmetryProvider]: this.stopSymmetryProvider,
        [LOGIN_EVENT_NAME.initiateSocialLogin]: this.initiateSocialLogin,
        [EVENT_NAME.devdockAnalyticsEvent]: this.eventSenderFromUI,
        [EVENT_NAME.devdockGenerateFilesEvent]: this.generateFilesForSource,
        [EVENT_NAME.devdockGetCurrentFocusFileNameEvent]:
          this.getCurrentFocusFileName,
        [EVENT_NAME.hideCenterBlankUIFromChatEvent]:
          this.hideCenterUIFromChatScreen,
      };
      eventHandlers[message.type as string]?.(message);
    });
  }

  public openSettings() {
    vscode.commands.executeCommand(DEVDOCK_COMMAND_NAME.settings);
  }

  public setTab(tab: ClientMessage) {
    this.view?.webview.postMessage({
      type: EVENT_NAME.devdockSetTab,
      value: {
        data: tab as string,
      },
    } as ServerMessage<string>);
  }

  public embedDocuments = async () => {
    const dirs = vscode.workspace.workspaceFolders;
    if (!dirs?.length) {
      vscode.window.showErrorMessage("No workspace loaded.");
      return;
    }
    if (!this._db) return;
    for (const dir of dirs) {
      (await this._db.injestDocuments(dir.uri.fsPath)).populateDatabase();
    }
  };

  public getConfigurationValue = (message: ClientMessage) => {
    if (!message.key) return;
    const config = vscode.workspace.getConfiguration("devdock");
    this.view?.webview.postMessage({
      type: EVENT_NAME.devdockGetConfigValue,
      value: {
        data: config.get(message.key as string),
        type: message.key,
      },
    } as ServerMessage<string>);
  };

  public setConfigurationValue = (message: ClientMessage) => {
    if (!message.key) return;
    const config = vscode.workspace.getConfiguration("devdock");
    config.update(message.key, message.data, vscode.ConfigurationTarget.Global);
  };

  public fetchOllamaModels = async () => {
    try {
      const models = await this._ollamaService?.fetchModels();
      if (!models?.length) {
        return;
      }
      this.view?.webview.postMessage({
        type: EVENT_NAME.devdockFetchOllamaModels,
        value: {
          data: models,
        },
      } as ServerMessage<ApiModel[]>);
    } catch (e) {
      return;
    }
  };

  public listTemplates = () => {
    const templates = this._templateProvider.listTemplates();
    this.view?.webview.postMessage({
      type: EVENT_NAME.devdockListTemplates,
      value: {
        data: templates,
      },
    } as ServerMessage<string[]>);
  };

  public sendNotification = (message: ClientMessage) => {
    vscode.window.showInformationMessage(message.data as string);
  };

  public clickSuggestion = (message: ClientMessage) => {
    vscode.commands.executeCommand(
      "devdock.templateCompletion",
      message.data as string
    );
  };

  public streamBountyRequestCompletion = async (
    data: ClientMessage<Message[]>
  ) => {
    const symmetryConnected = this._sessionManager?.get(
      EXTENSION_SESSION_NAME.devdockSymmetryConnection
    );
    if (symmetryConnected) {
      const systemMessage = {
        role: SYSTEM,
        content: await this._templateProvider?.readSystemMessageTemplate(),
      };

      const messages = [systemMessage, ...(data.data as Message[])];

      updateLoadingMessage(this.view, "Using symmetry for inference");

      logger.log(`
        Using symmetry for inference
        Messages: ${JSON.stringify(messages)}
      `);

      return this.symmetryService?.write(
        createSymmetryMessage<InferenceRequest>(
          SYMMETRY_DATA_MESSAGE.inference,
          {
            messages,
            key: SYMMETRY_EMITTER_KEY.inference,
          }
        )
      );
    }

    this.chatService?.streamBountyCompletion(
      data.data || [],
      (completion: string) => {
        console.log("this.chatService?.streamBountyCompletion", completion);
        const val = this.parseFilesFromString(completion);
        console.log(
          "this.chatService?.streamBountyCompletion parseFilesFromString",
          val
        );
        vscode.commands.executeCommand(
          DEVDOCK_COMMAND_NAME.devdockBountyFilesResponse,
          val
        );
      }
    );
  };

  public parseFilesFromString(
    inputString: string
  ): Array<{ fileName: string; content: string }> {
    const fileObjects: Array<{ fileName: string; content: string }> = [];

    // Regex to capture fileName and content, with improved handling for special characters
    const regex = /{\s*"filename":\s*"([^"]+)",\s*"content":\s*"(.*?)"\s*}/gs;
    let match: RegExpExecArray | null;

    // Iterate through each match in the input string
    while ((match = regex.exec(inputString)) !== null) {
      const fileName = match[1]; // Capture the filename
      let fileContent = match[2]; // Capture the content

      // Decode escape sequences in the content (especially for newlines, quotes, etc.)
      fileContent = fileContent
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\"); // Unescape common characters

      // Push the result as an object
      fileObjects.push({
        fileName: fileName,
        content: fileContent,
      });
    }

    return fileObjects;
  }

  public streamChatCompletion = async (data: ClientMessage<Message[]>) => {
    const symmetryConnected = this._sessionManager?.get(
      EXTENSION_SESSION_NAME.devdockSymmetryConnection
    );
    if (symmetryConnected) {
      const systemMessage = {
        role: SYSTEM,
        content: await this._templateProvider?.readSystemMessageTemplate(),
      };

      const messages = [systemMessage, ...(data.data as Message[])];

      updateLoadingMessage(this.view, "Using symmetry for inference");

      logger.log(`
        Using symmetry for inference
        Messages: ${JSON.stringify(messages)}
      `);

      return this.symmetryService?.write(
        createSymmetryMessage<InferenceRequest>(
          SYMMETRY_DATA_MESSAGE.inference,
          {
            messages,
            key: SYMMETRY_EMITTER_KEY.inference,
          }
        )
      );
    }

    this.chatService?.streamChatCompletion(data.data || []);
  };

  public async streamTemplateCompletion(template: string) {
    const symmetryConnected = this._sessionManager?.get(
      EXTENSION_SESSION_NAME.devdockSymmetryConnection
    );
    if (symmetryConnected && this.chatService) {
      const messages = await this.chatService.getTemplateMessages(template);

      logger.log(`
        Using symmetry for inference
        Messages: ${JSON.stringify(messages)}
      `);
      return this.symmetryService?.write(
        createSymmetryMessage<InferenceRequest>(
          SYMMETRY_DATA_MESSAGE.inference,
          {
            messages,
            key: SYMMETRY_EMITTER_KEY.inference,
          }
        )
      );
    }
    this.chatService?.streamTemplateCompletion(template);
  }

  public getSelectedText = () => {
    this.view?.webview.postMessage({
      type: EVENT_NAME.devdockTextSelection,
      value: {
        type: WORKSPACE_STORAGE_KEY.selection,
        completion: getTextSelection(),
      },
    });
  };

  public acceptSolution = (message: ClientMessage) => {
    const editor = vscode.window.activeTextEditor;
    const selection = editor?.selection;
    if (!selection) return;
    vscode.window.activeTextEditor?.edit((editBuilder) => {
      editBuilder.replace(selection, message.data as string);
    });
  };

  public createNewUntitledDocument = async (message: ClientMessage) => {
    const lang = getLanguage();
    const document = await vscode.workspace.openTextDocument({
      content: message.data as string,
      language: lang.languageId,
    });
    await vscode.window.showTextDocument(document);
  };

  public getGlobalContext = (message: ClientMessage) => {
    const storedData = this._context?.globalState.get(
      `${EVENT_NAME.devdockGlobalContext}-${message.key}`
    );
    this.view?.webview.postMessage({
      type: `${EVENT_NAME.devdockGlobalContext}-${message.key}`,
      value: storedData,
    });
  };

  public getTheme = () => {
    this.view?.webview.postMessage({
      type: EVENT_NAME.devdockSendTheme,
      value: {
        data: getTheme(),
      },
    });
  };

  public getCurrentLanguage = () => {
    this.view?.webview.postMessage({
      type: EVENT_NAME.devdockSendLanguage,
      value: {
        data: getLanguage(),
      },
    } as ServerMessage);
  };

  public getGitCommitMessage = async () => {
    const diff = await getGitChanges();
    if (!diff.length) {
      vscode.window.showInformationMessage(
        "No changes found in the current workspace."
      );
      return;
    }
    this.conversationHistory?.resetConversation();
    this.chatService?.streamTemplateCompletion(
      "commit-message",
      diff,
      (completion: string) => {
        vscode.commands.executeCommand("devdock.sendTerminalText", completion);
      },
      true
    );
  };

  public getSessionContext = (data: ClientMessage) => {
    if (!data.key) return undefined;
    this.view?.webview.postMessage({
      type: `${EVENT_NAME.devdockSessionContext}-${data.key}`,
      value: this._sessionManager.get(data.key),
    });
  };

  public setGlobalContext = (message: ClientMessage) => {
    this._context?.globalState.update(
      `${EVENT_NAME.devdockGlobalContext}-${message.key}`,
      message.data
    );
  };

  public getDevdockWorkspaceContext = (message: ClientMessage) => {
    const storedData = this._context?.workspaceState.get(
      `${EVENT_NAME.devdockWorkspaceContext}-${message.key}`
    );
    this.view?.webview.postMessage({
      type: `${EVENT_NAME.devdockWorkspaceContext}-${message.key}`,
      value: storedData,
    } as ServerMessage);
  };

  public setWorkspaceContext = <T>(message: ClientMessage<T>) => {
    const value = message.data;
    this._context.workspaceState.update(
      `${EVENT_NAME.devdockWorkspaceContext}-${message.key}`,
      value
    );
    this.view?.webview.postMessage({
      type: `${EVENT_NAME.devdockWorkspaceContext}-${message.key}`,
      value,
    });
  };

  public newConversation() {
    this.symmetryService?.write(
      createSymmetryMessage(SYMMETRY_DATA_MESSAGE.newConversation)
    );
  }

  public destroyStream = () => {
    this.chatService?.destroyStream();
    this.view?.webview.postMessage({
      type: EVENT_NAME.devdockStopGeneration,
    });
  };

  private connectToSymmetry = () => {
    if (this._config.symmetryServerKey) {
      this.symmetryService?.connect(this._config.symmetryServerKey);
    }
  };

  private disconnectSymmetry = async () => {
    if (this._config.symmetryServerKey) {
      await this.symmetryService?.disconnect();
    }
  };

  public createSymmetryProvider = () => {
    this.symmetryService?.startSymmetryProvider();
  };

  public stopSymmetryProvider = () => {
    this.symmetryService?.stopSymmetryProvider();
  };

  private devdockHideBackButton() {
    vscode.commands.executeCommand(DEVDOCK_COMMAND_NAME.hideBackButton);
  }

  private initiateSocialLogin() {
    console.log("initiateSocialLogin");
    vscode.commands.executeCommand(DEVDOCK_COMMAND_NAME.githubConnect);
    // vscode.commands.executeCommand(DEVDOCK_COMMAND_NAME.devdockOpenSigner);
  }
  private hideCenterUIFromChatScreen() {
    vscode.commands.executeCommand(
      DEVDOCK_COMMAND_NAME.hideCenterBlankUIFromChat
    );
  }

  private eventSenderFromUI(message: ClientMessage) {
    console.log("eventSenderFromUI", message);
    const eventName = message.key as string;
    const data = message?.data as Record<string, any> | boolean;
    analytics.trackEvent(eventName, data);
  }
  private generateFilesForSource(message: ClientMessage) {
    vscode.commands.executeCommand(
      DEVDOCK_COMMAND_NAME.devdockGenerateFilesCommand,
      message
    );
  }
  private getCurrentFocusFileName(message: ClientMessage) {
    vscode.commands.executeCommand(
      DEVDOCK_COMMAND_NAME.devdockGetCurrentFocusFileNameCommand,
      message
    );
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._context.extensionUri, "out", "sidebar.js")
    );

    const codiconCssUri = vscode.Uri.joinPath(
      this._context.extensionUri,
      "assets",
      "codicon.css"
    );

    const css = webview.asWebviewUri(
      vscode.Uri.joinPath(this._context.extensionUri, "out", "sidebar.css")
    );

    const codiconCssWebviewUri = webview.asWebviewUri(codiconCssUri);

    const nonce = getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <link href="${codiconCssWebviewUri}" rel="stylesheet">
        <link href="${css}" rel="stylesheet">
        <meta charset="UTF-8">
				<meta
          http-equiv="Content-Security-Policy"
          content="default-src 'self' http://localhost:11434;
          img-src vscode-resource: https:;
          font-src vscode-webview-resource:;
          script-src 'nonce-${nonce}';style-src vscode-resource: 'unsafe-inline' http: https: data:;"
        >
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sidebar</title>
        <style>
          body { padding: 10px }
        </style>
    </head>
    <body>
        <div id="root"></div>
        <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>`;
  }
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
