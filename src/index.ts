import {
  commands,
  ExtensionContext,
  languages,
  StatusBarAlignment,
  window,
  workspace,
} from "vscode";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { EmbeddingDatabase } from "./extension/embeddings";
import * as vscode from "vscode";

import { CompletionProvider } from "./extension/providers/completion";
import { SidebarProvider } from "./extension/providers/sidebar";
import { SessionManager } from "./extension/session-manager";
import { Utils } from "vscode-uri";
import {
  delayExecution,
  getTerminal,
  getSanitizedCommitMessage,
} from "./extension/utils";
import { setContext } from "./extension/context";
import {
  EXTENSION_CONTEXT_NAME,
  EXTENSION_NAME,
  EVENT_NAME,
  WEBUI_TABS,
  DEVDOCK_COMMAND_NAME,
} from "./common/constants";
import { TemplateProvider } from "./extension/template-provider";
import { ServerMessage } from "./common/types";
import { FileInteractionCache } from "./extension/file-interaction";
import { getLineBreakCount } from "./webview/utils";
import {
  auth0Config,
  socialLogin,
  handleAuthentication,
  initWeb3Auth,
} from "./common/auth";
import { assignReward } from "./common/viem";
import Analytics from "./common/analytics";
import { AnalyticsEvents } from "./common/analyticsEventKeys";

export async function activate(context: ExtensionContext) {
  setContext(context);
  const enabApiForTrackingEvents = true;
  Analytics.init(enabApiForTrackingEvents);
  const config = workspace.getConfiguration("devdock");
  const statusBar = window.createStatusBarItem(StatusBarAlignment.Right);
  const templateDir = path.join(os.homedir(), ".devdock/templates") as string;
  const templateProvider = new TemplateProvider(templateDir);
  const fileInteractionCache = new FileInteractionCache();
  const sessionManager = new SessionManager();

  const homeDir = os.homedir();
  const dbDir = path.join(homeDir, ".devdock/embeddings");
  let db;

  if (workspace.name) {
    const dbPath = path.join(dbDir, workspace.name as string);

    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    db = new EmbeddingDatabase(dbPath, context);
    await db.connect();
  }

  const sidebarProvider = new SidebarProvider(
    statusBar,
    context,
    templateDir,
    db,
    sessionManager
  );

  const completionProvider = new CompletionProvider(
    statusBar,
    fileInteractionCache,
    templateProvider,
    context
  );

  templateProvider.init();

  let terminal: vscode.Terminal | undefined;

  function createAndShowTerminal() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!workspaceFolder) {
      vscode.window.showErrorMessage("No workspace folder open.");
      return;
    }

    if (terminal) {
      terminal.dispose();
    }

    const terminalOptions: vscode.TerminalOptions = {
      name: "Devdock Terminal",
      cwd: workspaceFolder,
    };

    terminal = vscode.window.createTerminal(terminalOptions);
    const shellScript = Utils.joinPath(context.extensionUri, "wrapper.sh");

    terminal.sendText(`sh ${shellScript.fsPath}`);
    terminal.show();

    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(workspaceFolder, "command_output.log")
    );
    watcher.onDidChange((uri) => {
      vscode.workspace.openTextDocument(uri).then(() => {
        const lastLine = readLastLine(
          path.join(workspaceFolder, "command_output.log")
        );
        vscode.window.showInformationMessage(`Terminal output: ${lastLine}`);
        if (lastLine?.toString() == "0") {
          //fetchWithStream("How to deploy a NFT SmartContract on Starknet")
          //assignReward("0x741267166ff2a1721f140B819B6f844F8C7D8d74", 10)
          vscode.window.showInformationMessage("You've Earned 10 DEV Tokens", {
            modal: true,
          });
        }
        //const content = doc.getText();
      });
    });
    context.subscriptions.push(watcher);
  }
  function getCurrentFileOpenedName() {
    console.log("getCurrentFileOpenedName called");

    const editor = vscode.window.activeTextEditor;
    if (editor) {
      // Get the full path of the file
      const fullPath = editor.document.fileName;
      // Extract only the file name using path.basename
      const fileName = path.basename(fullPath);
      const fileContent = editor.document.getText();
      // Show the file name in a message
      vscode.window.showInformationMessage(`File name: ${fileName}`);
      console.log(`File name: ${fileName}`);
      // console.log(`File content: ${fileContent}`);

      const fileInfo = {
        fileName: fileName,
        fileData: fileContent,
      };
      const fileInfoString = JSON.stringify(fileInfo);

      console.log(fileInfoString);

      sidebarProvider.view?.webview.postMessage({
        type: EVENT_NAME.devdockGetCurrentFocusFileNameEvent,
        value: {
          data: fileInfoString,
        },
      } as ServerMessage<string>);
    } else {
      vscode.window.showInformationMessage("No active editor");
      console.log("No active editor");
    }
  }
  function hideCenterUiFromChatScreen() {
    sidebarProvider.view?.webview.postMessage({
      type: EVENT_NAME.hideCenterBlankUIFromChatEvent,
    } as ServerMessage<string>);
  }

  createAndShowTerminal();

  async function generateFilesFromResponse(
    response: string, // Assuming response is a JSON string
    createInCurrentWorkspace: boolean
  ) {
    console.log(
      "generateFilesFromResponse called with createInCurrentWorkspace =",
      createInCurrentWorkspace
    );

    // Parse the response string to JSON (if it is not already an object)
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response);
    } catch (error) {
      console.error("Failed to parse response JSON:", error);
      vscode.window.showErrorMessage("Invalid response format");
      return;
    }

    const fileData = parseResponse(parsedResponse);

    let workspaceUri: vscode.Uri;

    // Logic for where to create the devcash folder
    if (createInCurrentWorkspace) {
      // Ensure workspace folders are available
      const workspaceFolders = vscode.workspace.workspaceFolders;
      console.log("workspaceFolders", workspaceFolders);
      if (!workspaceFolders) {
        vscode.window.showErrorMessage(
          "No workspace folder is open. Please open a workspace and try again."
        );
        return;
      }

      // Use the current workspace's first folder
      workspaceUri = vscode.Uri.joinPath(workspaceFolders[0].uri, "devcash");
    } else {
      // Create a new folder in the user's home directory (or other location)
      const homeDir = require("os").homedir();
      const newWorkspacePath = path.join(homeDir, "newWorkspaceForDevcash");

      // Ensure the new folder exists
      if (!fs.existsSync(newWorkspacePath)) {
        fs.mkdirSync(newWorkspacePath, { recursive: true });
      }

      // Set the workspaceUri to the new workspace folder
      workspaceUri = vscode.Uri.file(newWorkspacePath);
      console.log(
        "Creating files in new workspace folder:",
        workspaceUri.fsPath
      );
    }

    // Create the 'devcash' folder
    const devcashFolderUri = vscode.Uri.joinPath(workspaceUri, "devcash");
    try {
      await vscode.workspace.fs.createDirectory(devcashFolderUri);
      vscode.window.showInformationMessage(
        "Folder 'devcash' created in the specified location."
      );
    } catch (err) {
      vscode.window.showErrorMessage(`Error creating folder 'devcash': ${err}`);
      return;
    }

    // Loop through file data and create files inside the 'devcash' folder
    for (const file of fileData) {
      const filePath = vscode.Uri.joinPath(devcashFolderUri, file.name);
      const fileContent = Buffer.from(file.content, "utf8");

      try {
        // Create or overwrite the file with the content
        await vscode.workspace.fs.writeFile(filePath, fileContent);
        vscode.window.showInformationMessage(
          `File ${file.name} created successfully in 'devcash' folder`
        );

        // Open the newly created file in the editor, without closing previous ones
        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document, { preview: false });
      } catch (err) {
        vscode.window.showErrorMessage(
          `Error creating or opening file ${file.name}: ${err}`
        );
      }
    }
  }

  function parseResponse(response: any) {
    // Check if response is an array
    if (!Array.isArray(response)) {
      console.error("The response is not in the expected format:", response);
      return [];
    }

    console.log("parseResponse called", response);

    // Clean the content of each file by removing unwanted characters
    const files = response.map(
      (file: { fileName: string; content: string }) => ({
        name: file.fileName,
        content: cleanContent(file.content), // Clean the content here
      })
    );

    return files;
  }

  // Utility function to clean the content by removing unwanted characters
  function cleanContent(content: string) {
    return content
      .replace(/\\n/g, "\n") // Replace escaped newlines with actual newlines
      .replace(/\\t/g, "\t") // Replace escaped tabs with actual tabs
      .replace(/\\"/g, '"') // Replace escaped quotes with actual quotes
      .replace(/\\\\/g, "\\") // Replace double backslashes with a single backslash
      .replace(/\s+$/g, "") // Remove trailing spaces
      .trim(); // Trim leading and trailing spaces
  }

  function readLastLine(filePath: string): string | undefined {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const lines = fileContent.trim().split("\n");
    return lines.length > 0 ? lines[lines.length - 1] : undefined;
  }

  context.subscriptions.push(
    languages.registerInlineCompletionItemProvider(
      { pattern: "**" },
      completionProvider
    ),

    commands.registerCommand(
      DEVDOCK_COMMAND_NAME.devdockGenerateFilesCommand,
      (response: string) => {
        generateFilesFromResponse(response, true);
      }
    ),

    commands.registerCommand(
      DEVDOCK_COMMAND_NAME.devdockBountyFilesResponse,
      (response: string) => {
        console.log(
          "DEVDOCK_COMMAND_NAME.devdockBountyFilesResponse generate files",
          response
        );
        generateFilesFromResponse(JSON.stringify(response), true);
      }
    ),

    commands.registerCommand(
      DEVDOCK_COMMAND_NAME.devdockGetCurrentFocusFileNameCommand,
      () => {
        getCurrentFileOpenedName();
      }
    ),

    commands.registerCommand(
      DEVDOCK_COMMAND_NAME.devdockAnalyticsCommand,
      (eventName, data?: Record<string, any> | boolean) => {
        Analytics.trackEvent(eventName, data);
      }
    ),

    commands.registerCommand(DEVDOCK_COMMAND_NAME.enable, () => {
      statusBar.show();
      createAndShowTerminal();
    }),
    commands.registerCommand(DEVDOCK_COMMAND_NAME.disable, () => {
      statusBar.hide();
    }),
    commands.registerCommand(DEVDOCK_COMMAND_NAME.explain, () => {
      commands.executeCommand(DEVDOCK_COMMAND_NAME.focusSidebar);
      delayExecution(() =>
        sidebarProvider?.streamTemplateCompletion("explain")
      );
    }),
    commands.registerCommand(DEVDOCK_COMMAND_NAME.addTypes, () => {
      commands.executeCommand(DEVDOCK_COMMAND_NAME.focusSidebar);
      delayExecution(() =>
        sidebarProvider?.streamTemplateCompletion("add-types")
      );
    }),
    commands.registerCommand(DEVDOCK_COMMAND_NAME.refactor, () => {
      commands.executeCommand(DEVDOCK_COMMAND_NAME.focusSidebar);
      delayExecution(() =>
        sidebarProvider?.streamTemplateCompletion("refactor")
      );
    }),
    commands.registerCommand(DEVDOCK_COMMAND_NAME.generateDocs, () => {
      commands.executeCommand(DEVDOCK_COMMAND_NAME.focusSidebar);
      delayExecution(() =>
        sidebarProvider?.streamTemplateCompletion("generate-docs")
      );
    }),
    commands.registerCommand(DEVDOCK_COMMAND_NAME.addTests, () => {
      commands.executeCommand(DEVDOCK_COMMAND_NAME.focusSidebar);
      delayExecution(() =>
        sidebarProvider?.streamTemplateCompletion("add-tests")
      );
    }),
    commands.registerCommand(
      DEVDOCK_COMMAND_NAME.templateCompletion,
      (template: string) => {
        commands.executeCommand(DEVDOCK_COMMAND_NAME.focusSidebar);
        delayExecution(() =>
          sidebarProvider?.streamTemplateCompletion(template)
        );
      }
    ),
    commands.registerCommand(DEVDOCK_COMMAND_NAME.stopGeneration, () => {
      completionProvider.onError();
      sidebarProvider.destroyStream();
    }),
    commands.registerCommand(DEVDOCK_COMMAND_NAME.templates, async () => {
      await vscode.commands.executeCommand(
        "vscode.openFolder",
        vscode.Uri.file(templateDir),
        true
      );
      Analytics.trackEvent(AnalyticsEvents.EditTemplatesClicked);
    }),
    commands.registerCommand(DEVDOCK_COMMAND_NAME.githubLogin, async () => {
      commands.executeCommand(
        "setContext",
        EXTENSION_CONTEXT_NAME.devdockSocialLogin,
        true
      );
      sidebarProvider.view?.webview.postMessage({
        type: EVENT_NAME.devdockSetTab,
        value: {
          data: WEBUI_TABS.login,
        },
      } as ServerMessage<string>);
      hideCenterUiFromChatScreen();
      Analytics.trackEvent(AnalyticsEvents.GithubIconClicked);
    }),

    commands.registerCommand(DEVDOCK_COMMAND_NAME.manageProviders, async () => {
      commands.executeCommand(
        "setContext",
        EXTENSION_CONTEXT_NAME.devdockManageProviders,
        true
      );
      sidebarProvider.view?.webview.postMessage({
        type: EVENT_NAME.devdockSetTab,
        value: {
          data: WEBUI_TABS.providers,
        },
      } as ServerMessage<string>);
      Analytics.trackEvent(AnalyticsEvents.ManageProvidersClicked);
      hideCenterUiFromChatScreen();
    }),
    commands.registerCommand(
      DEVDOCK_COMMAND_NAME.devdockSymmetryTab,
      async () => {
        commands.executeCommand(
          "setContext",
          EXTENSION_CONTEXT_NAME.devdockSymmetryTab,
          true
        );
        sidebarProvider.view?.webview.postMessage({
          type: EVENT_NAME.devdockSetTab,
          value: {
            data: WEBUI_TABS.symmetry,
          },
        } as ServerMessage<string>);
        hideCenterUiFromChatScreen();
        Analytics.trackEvent(AnalyticsEvents.SymmetryNetworkSettingsClicked);
      }
    ),
    commands.registerCommand(
      DEVDOCK_COMMAND_NAME.conversationHistory,
      async () => {
        commands.executeCommand(
          "setContext",
          EXTENSION_CONTEXT_NAME.devdockConversationHistory,
          true
        );
        sidebarProvider.view?.webview.postMessage({
          type: EVENT_NAME.devdockSetTab,
          value: {
            data: WEBUI_TABS.history,
          },
        } as ServerMessage<string>);
        hideCenterUiFromChatScreen();
        Analytics.trackEvent(AnalyticsEvents.ConversationHistoryClicked);
      }
    ),
    commands.registerCommand(DEVDOCK_COMMAND_NAME.manageTemplates, async () => {
      commands.executeCommand(
        "setContext",
        EXTENSION_CONTEXT_NAME.devdockManageTemplates,
        true
      );
      sidebarProvider.view?.webview.postMessage({
        type: EVENT_NAME.devdockSetTab,
        value: {
          data: WEBUI_TABS.settings,
        },
      } as ServerMessage<string>);
      Analytics.trackEvent(AnalyticsEvents.ManageTemplatesClicked);
    }),
    commands.registerCommand(DEVDOCK_COMMAND_NAME.hideBackButton, () => {
      commands.executeCommand(
        "setContext",
        EXTENSION_CONTEXT_NAME.devdockManageTemplates,
        false
      );
      commands.executeCommand(
        "setContext",
        EXTENSION_CONTEXT_NAME.devdockConversationHistory,
        false
      );
      commands.executeCommand(
        "setContext",
        EXTENSION_CONTEXT_NAME.devdockSymmetryTab,
        false
      );
      commands.executeCommand(
        "setContext",
        EXTENSION_CONTEXT_NAME.devdockManageProviders,
        false
      );
      commands.executeCommand(
        "setContext",
        EXTENSION_CONTEXT_NAME.devdockSocialLogin,
        false
      );
    }),
    commands.registerCommand(DEVDOCK_COMMAND_NAME.openChat, () => {
      commands.executeCommand(DEVDOCK_COMMAND_NAME.hideBackButton);
      sidebarProvider.view?.webview.postMessage({
        type: EVENT_NAME.devdockSetTab,
        value: {
          data: WEBUI_TABS.chat,
        },
      } as ServerMessage<string>);
      Analytics.trackEvent(AnalyticsEvents.BackArrowClicked);
    }),
    commands.registerCommand(DEVDOCK_COMMAND_NAME.settings, () => {
      vscode.commands.executeCommand(
        "workbench.action.openSettings",
        EXTENSION_NAME
      );
      Analytics.trackEvent(AnalyticsEvents.SettingsClicked);
    }),
    commands.registerCommand(
      DEVDOCK_COMMAND_NAME.sendTerminalText,
      async (commitMessage: string) => {
        const terminal = await getTerminal();
        terminal?.sendText(getSanitizedCommitMessage(commitMessage), false);
      }
    ),
    commands.registerCommand(DEVDOCK_COMMAND_NAME.getGitCommitMessage, () => {
      commands.executeCommand(DEVDOCK_COMMAND_NAME.focusSidebar);
      sidebarProvider.conversationHistory?.resetConversation();
      delayExecution(() => sidebarProvider.getGitCommitMessage(), 400);
    }),
    commands.registerCommand(DEVDOCK_COMMAND_NAME.newConversation, () => {
      sidebarProvider.conversationHistory?.resetConversation();
      sidebarProvider.newConversation();
      sidebarProvider.view?.webview.postMessage({
        type: EVENT_NAME.devdockStopGeneration,
      } as ServerMessage<string>);
      Analytics.trackEvent(AnalyticsEvents.StartNewChatClicked);
    }),

    commands.registerCommand(DEVDOCK_COMMAND_NAME.githubConnect, async () => {
      socialLogin(context);
    }),

    commands.registerCommand(
      DEVDOCK_COMMAND_NAME.hideCenterBlankUIFromChat,
      async () => {
        hideCenterUiFromChatScreen();
      }
    ),

    /**
     * Creates a custom terminal. Wraps a shell script around this terminal
     * This script will now listen to any command fired while using the terminal
     */
    commands.registerCommand(DEVDOCK_COMMAND_NAME.listenTerminal, () => {
      createAndShowTerminal();
    }),

    window.registerWebviewViewProvider("devdock.sidebar", sidebarProvider),
    statusBar
  );

  context.subscriptions.push(
    workspace.onDidCloseTextDocument((document) => {
      const filePath = document.uri.fsPath;
      fileInteractionCache.endSession();
      fileInteractionCache.delete(filePath);
    }),
    workspace.onDidOpenTextDocument((document) => {
      const filePath = document.uri.fsPath;
      fileInteractionCache.startSession(filePath);
      fileInteractionCache.incrementVisits();
    }),
    workspace.onDidChangeTextDocument((e) => {
      const changes = e.contentChanges[0];
      if (!changes) return;
      const lastCompletion = completionProvider.lastCompletionText;
      const isLastCompltionMultiline = getLineBreakCount(lastCompletion) > 1;
      completionProvider.setAcceptedLastCompletion(
        !!(
          changes.text &&
          lastCompletion &&
          changes.text === lastCompletion &&
          isLastCompltionMultiline
        )
      );
      const currentLine = changes.range.start.line;
      const currentCharacter = changes.range.start.character;
      fileInteractionCache.incrementStrokes(currentLine, currentCharacter);
    })
  );

  window.onDidChangeTextEditorSelection(() => {
    completionProvider.abortCompletion();
    delayExecution(() => {
      completionProvider.setAcceptedLastCompletion(false);
    }, 200);
  });

  context.subscriptions.push(
    workspace.onDidChangeConfiguration((event) => {
      if (!event.affectsConfiguration("devdock")) return;
      completionProvider.updateConfig();
    })
  );

  if (config.get("enabled")) statusBar.show();
  statusBar.text = "🤖";

  // Register the URI handler to capture the callback
  vscode.window.registerUriHandler({
    handleUri(uri: vscode.Uri) {
      console.log("OnGithubLogin are we here...");
      if (uri.path === "/auth/callback") {
        // Parse the query parameters to extract the authorization code
        const fragment = uri.fragment; // This will get everything after `#`

        // Parse the fragment to get the access_token
        const params = new URLSearchParams(fragment); // Treat the fragment like query parameters
        const accessToken = params.get("access_token"); // Extract access_token

        if (accessToken) {
          // vscode.window.showInformationMessage(`Access token: ${accessToken}`);
          // console.log("Access Token:", accessToken);
          // exchangeCodeForToken(accessToken);
          // You can now use the access token to make authenticated requests
          trySignerThing();
        } else {
          vscode.window.showErrorMessage(
            "Failed to extract access token from URI."
          );
        }
      }
    },
  });

  const trySignerThing = () => {
    console.log("trySignerThing");
    const panel = vscode.window.createWebviewPanel(
      "signerView", // Identifies the type of the WebView
      "Signer Flow", // Title of the WebView
      vscode.ViewColumn.One, // Editor column to show the WebView
      {
        enableScripts: true, // Enable JavaScript in the WebView
      }
    );

    // Set initial HTML content for the WebView
    panel.webview.html = getWebviewContent();
    // sidebarProvider.view!.webview.html = getWebviewContent();

    // Handle messages from WebView
    // sidebarProvider.view?.webview.onDidReceiveMessage(
    panel.webview.onDidReceiveMessage(
      async (message) => {
        if (message.command === "startSigning") {
          // Create the signer instance
          // const signer = new Signer();
          console.log("put signer code here");

          // const signedData = await signer.sign(message.payload); // Payload comes from the WebView
          // console.log("signedData", signedData);

          // Send the signed data back to the WebView
          // sidebarProvider.view?.webview.postMessage({
          //   command: "signedData",
          //   data: signedData,
          // });
        }
      },
      undefined,
      context.subscriptions
    );
  };
  // Function to exchange the authorization code for an access token
  async function exchangeCodeForToken(code: string) {
    console.log("exchangeCodeForToken");
    const clientId = "dev-nnxojm0y7p8jah4w.us.auth0.com";
    const clientSecret = process.env.ALCHEMY_CLIENT_SECRET;
    const tokenUrl = process.env.ALCHEMY_AUTH0_DOMAIN;

    const response = await fetch(tokenUrl!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: process.env.ALCHEMY_AUTH0_REDIRECT_URI,
      }),
    });

    const data = await response.json();

    if (data.access_token) {
      vscode.window.showInformationMessage("OAuth login successful!");
      // You can now use the access token to make authenticated requests
      console.log("Access Token:", data.access_token);
    } else {
      vscode.window.showErrorMessage(
        "Failed to exchange OAuth code for token."
      );
    }
  }

  function getWebviewContent() {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Signer Flow</title>
    </head>
    <body>
      <h1>Signer Flow</h1>
      <button id="signBtn">Start Signing</button>
      <div id="signedData"></div>

      <script>
        const vscode = acquireVsCodeApi();

        document.getElementById('signBtn').addEventListener('click', () => {
          vscode.postMessage({ command: 'startSigning', payload: 'Sample data to sign' });
        });

        window.addEventListener('message', (event) => {
          const message = event.data;
          if (message.command === 'signedData') {
            document.getElementById('signedData').textContent = 'Signed Data: ' + message.data;
          }
        });
      </script>
    </body>
    </html>
  `;
  }
}
