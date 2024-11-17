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
import { ClientMessage, ServerMessage } from "./common/types";
import { FileInteractionCache } from "./extension/file-interaction";
import { getLineBreakCount } from "./webview/utils";
import { socialLogin } from "./common/auth";
import Analytics from "./common/analytics";
import { AnalyticsEvents } from "./common/analyticsEventKeys";
import {
  getUserData,
  isUserLoggedInAuth0,
  setIsLoggedIn,
  setUserData,
} from "./extension/store";
import { AlchemyProvider, ethers, Wallet } from "ethers";
import apiService from "./services/apiService";
import { API_END_POINTS } from "./services/apiEndPoints";
import { DevdockPoints, PointsEvents } from "./common/devdockPoints";
import { submitBounty } from "./extension/bountySubmission/submitBounty";

import * as fcl from "@onflow/fcl";
import { authz } from "./extension/flow/authz";
import { ec } from "elliptic";
import { keyGen } from "./extension/flow/create_keypair";
import { getFileExtensionMapping } from "./common/extensionsMapping";
import { createDevdockBounty } from "./extension/bountyCreation/devdockBounty";
import { submitDevdockBounty } from "./extension/bountySubmission/devdockSubmitBounty";
import { enable_axon_vault_for_user } from "./extension/axon_vault_enable/axon_vault_creation";

let sidebarProvider: SidebarProvider;
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

  sidebarProvider = new SidebarProvider(
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

  async function getRagForQuery(dataVals: any) {
    const userQuery = dataVals.data;
    const web3Chains = context.globalState.get("web3Chains") as string;
    console.log("web3Chains", web3Chains);
    const chainKeyBasedOnUserQuery = await apiService.askChatGPT(
      userQuery,
      "gpt-4",
      0.7,
      web3Chains
    );
    console.log(
      "getRagForQuery chainKeyBasedOnUserQuery",
      chainKeyBasedOnUserQuery
    );

    context.globalState.update(
      "chatGPTProviderChainKey",
      chainKeyBasedOnUserQuery
    );
    const devdockRagData = context.globalState.get("devdockRagData") as any;

    const providerBasedOnQuery = getBotByChain(
      devdockRagData?.data,
      chainKeyBasedOnUserQuery
    );
    console.log("devdockRagData based on Query ", providerBasedOnQuery);
    context.globalState.update(
      "devDockProviderBasedOnUserQuery",
      providerBasedOnQuery
    );

    sidebarProvider.view?.webview.postMessage({
      type: EVENT_NAME.getRagForQuery,
      value: {
        data: chainKeyBasedOnUserQuery,
      },
    } as ServerMessage<string>);
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
  fetchDevDockRags();

  // fetchUserActionsList();
  const isPrivateKeyAvailable = context.globalState.get(
    "flowWalletPrivateKey"
  ) as string;
  if (
    isPrivateKeyAvailable === null ||
    isPrivateKeyAvailable === undefined ||
    isPrivateKeyAvailable === ""
  ) {
    initiateFlow();
  } else {
    console.log("FlowPrivateKey is available, not creating again");
  }

  checkAndEnableAxonVault();

  getFileExtensionMapping().then((fileMappings: any) => {
    console.log("getFileExtensionMapping", fileMappings);
    context.globalState.update("getFileExtensionMapping", fileMappings);
  });

  const devdockPoints = DevdockPoints.getInstance(context);
  // context.globalState.update("signupPointsAlloted", "NO");

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
    const workspaceFolders = vscode.workspace.workspaceFolders;
    console.log("workspaceFolders", workspaceFolders);
    // if (!workspaceFolders) {
    //   vscode.window.showErrorMessage(
    //     "No workspace folder is open. Please open a workspace and try again."
    //   );
    //   return;
    // }
    if (workspaceFolders) {
      // Ensure workspace folders are available

      // Use the current workspace's first folder
      workspaceUri = vscode.Uri.joinPath(workspaceFolders[0].uri, "devcash");
    } else {
      // Create a new folder in the user's home directory (or other location)
      const homeDir = require("os").homedir();
      const newWorkspacePath = path.join(homeDir, "Devcash");

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
      DEVDOCK_COMMAND_NAME.devdockBountySubmitRequestCommand,
      (response: ClientMessage) => {
        console.log(
          "DEVDOCK_COMMAND_NAME.devdockBountySubmitRequestCommand",
          response
        );
        if (response?.data !== undefined) {
          submitBountyRequest(response.data.toString());
        }
      }
    ),

    commands.registerCommand(
      DEVDOCK_COMMAND_NAME.devdockBountyCreateRequestCommand,
      (response: ClientMessage) => {
        console.log(
          "DEVDOCK_COMMAND_NAME.devdockBountyCreateRequestCommand",
          response
        );
        if (response?.data !== undefined) {
          createDevDockBounty(response.data.toString());
        }
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

    commands.registerCommand(
      DEVDOCK_COMMAND_NAME.devdockLogoutUser,
      async () => {
        console.log("index.ts logout command executed");
        context.globalState.update("userProfileInfo", "");
        // context.globalState.update("signupPointsAlloted", "NO");
      }
    ),

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

    commands.registerCommand(
      DEVDOCK_COMMAND_NAME.showCommonPopup,
      async (dataVals) => {
        sidebarProvider.view?.webview.postMessage({
          type: EVENT_NAME.showCommonPopup,
          value: {
            data: dataVals,
          },
        } as ServerMessage<string>);
      }
    ),
    commands.registerCommand(
      DEVDOCK_COMMAND_NAME.showBountyCreationPopup,
      async (dataVals) => {
        sidebarProvider.view?.webview.postMessage({
          type: EVENT_NAME.showBountyCreationPopUp,
          value: {
            data: dataVals,
          },
        } as ServerMessage<string>);
      }
    ),
    commands.registerCommand(
      DEVDOCK_COMMAND_NAME.getRagForQuery,
      (dataVals) => {
        getRagForQuery(dataVals);
      }
    ),

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
    async handleUri(uri: vscode.Uri) {
      console.log("OnGithubLogin are we here...", uri);
      if (uri.path === "/auth/callback") {
        // Parse the query parameters to extract the authorization code
        const fragment = uri.fragment; // This will get everything after `#`

        // Parse the fragment to get the access_token
        const params = new URLSearchParams(fragment); // Treat the fragment like query parameters
        console.log("Github login params", params);
        const accessToken = params.get("access_token"); // Extract access_token

        console.log("GithubAccessToken", accessToken);

        if (accessToken) {
          setIsLoggedIn(true);

          const gitHubUserInfo: any = await fetchGithubUserDetails(accessToken);

          console.log("gitHubUserInfo", gitHubUserInfo);
          // fetchAccessToken(id_token);
          //save user gitHubUserInfo in localstorage so that it can be fetched thorough out

          const createUserBodyData = {
            github_id: gitHubUserInfo?.nickname,
            username: gitHubUserInfo?.nickname,
            github_username: gitHubUserInfo?.nickname,
            email: gitHubUserInfo?.email,
            rank: 0,
          };

          try {
            apiService
              .post(API_END_POINTS.CREATE_USER, createUserBodyData)
              .then((response: any) => {
                console.log("user created or logged in", response);

                const userId = response.data.id;
                context.globalState.update("userID", userId);

                const signupPointsAllotedEarlier = context.globalState.get(
                  "signupPointsAlloted"
                );
                if (
                  signupPointsAllotedEarlier &&
                  signupPointsAllotedEarlier == "YES"
                ) {
                  //allocate login points
                  devdockPoints.pointsEventDoneFor(
                    PointsEvents.DAILYLOGIN,
                    userId
                  );
                } else {
                  //assign signup points and save assign points
                  context.globalState.update("signupPointsAlloted", "YES");
                  //allocate signup points
                  devdockPoints.pointsEventDoneFor(PointsEvents.SIGNUP, userId);
                }

                console.log("User ID:", userId);

                // const userWallets = response.data.wallets;
                const myPrivateKey = context.globalState.get("userPrivateKey");
                // const flowPrivateKey = context.globalState.get(
                //   "flowWalletPrivateKey"
                // );
                // const ethWallet = getWalletFromPrivateKey(
                //   myPrivateKey as string
                // );

                // const flowWallet = getWalletFromPrivateKey(
                //   flowPrivateKey as string
                // );

                if (
                  myPrivateKey == undefined ||
                  myPrivateKey == "" ||
                  myPrivateKey == null
                ) {
                  const flowWalletAddress =
                    context.globalState.get("flowWalletAddress");

                  try {
                    checkAndEnableAxonVault();
                  } catch (error) {
                    console.log("checkAndEnableAxonVault error ", error);
                  }

                  createEthWalletForUser(
                    (wallet: Wallet) => {
                      console.log("wallet created", wallet.address);
                      const bodyToCreateWallet = [
                        {
                          user_id: userId,
                          wallet_address: wallet.address,
                          currency: "ETH",
                          chain: "ETHEREUM",
                          balance: 0,
                        },
                        {
                          user_id: userId,
                          wallet_address: flowWalletAddress,
                          currency: "FLOW",
                          chain: "FLOW",
                          balance: 0,
                        },
                      ];

                      apiService
                        .post(
                          API_END_POINTS.CREATE_MULTIPLE_WALLETS,
                          bodyToCreateWallet
                        )
                        .then((response: any) => {
                          console.log(
                            "Created wallet details posted to backend",
                            response
                          );

                          console.log("fetch user info, load in local storage");

                          fetchUserInfo(
                            userId, //user id
                            () => {
                              console.log("OnSuccess");
                            },
                            () => {
                              console.log("OnFailure");
                            }
                          );
                        });
                    },
                    (error) => {
                      console.log(
                        "wallet details posting to backend failed",
                        error
                      );
                    }
                  );
                } else {
                  //user has already a private key
                  console.log("user has private key store in localstorage");
                  console.log("fetch user info, load in local storage");
                  try {
                    checkAndEnableAxonVault();
                  } catch (error) {
                    console.log("checkAndEnableAxonVault error ", error);
                  }
                  fetchUserInfo(
                    userId, //user id
                    () => {
                      console.log("OnSuccess");
                    },
                    () => {
                      console.log("OnFailure");
                    }
                  );
                }
                // if (userWallets.length > 0) {
                //   //user has wallets no need to create

                //   console.log("user has wallets");
                //   fetchUserInfo(
                //     userId, //user id
                //     () => {
                //       console.log("OnSuccess");
                //     },
                //     () => {
                //       console.log("OnFailure");
                //     }
                //   );
                // } else {
                //   //user dont have wallet create one and post to backend
                //   console.log("user has no wallets, creating now");
                //   createEthWalletForUser(
                //     (wallet: Wallet) => {
                //       console.log("wallet created", wallet.address);
                //       const bodyToCreateWallet = {
                //         user_id: userId,
                //         wallet_address: wallet.address,
                //         chain: "ETHEREUM",
                //         balance: 0,
                //       };

                //       apiService
                //         .post(API_END_POINTS.CREATE_WALLET, bodyToCreateWallet)
                //         .then((response: any) => {
                //           console.log(
                //             "Created wallet details posted to backend",
                //             response
                //           );

                //           console.log("fetch user info, load in local storage");

                //           fetchUserInfo(
                //             userId, //user id
                //             () => {
                //               console.log("OnSuccess");
                //             },
                //             () => {
                //               console.log("OnFailure");
                //             }
                //           );
                //         });
                //     },
                //     (error) => {
                //       console.log(
                //         "wallet details posting to backend failed",
                //         error
                //       );
                //     }
                //   );
                // }
              });
          } catch (error) {
            //error in user creation
            console.log("error in user creation", error);
            //this means user already exist
          }
        } else {
          vscode.window.showErrorMessage(
            "Failed to extract access token from URI."
          );
        }
      }
    },
  });

  const fetchUserWallet = (
    userId: number,
    onSuccess: (response: any) => void,
    onFailure: () => void
  ) => {
    apiService
      .get(API_END_POINTS.FETCH_USER_WALLET + "/" + userId)
      .then((response: any) => {
        const { wallet_address, balance, chain } = response.data;
        if (wallet_address) {
          onSuccess(response.data);
        } else {
          onFailure();
        }
      });
  };

  //access the stored data in any other class
  const getUserInfo = () => {
    return context.globalState.get("userProfileInfo");
  };

  const createEthWalletForUser = (
    onWalletCreated: (wallet: Wallet, privateKey: string) => void,
    onFailure: (error: any) => void
  ) => {
    console.log("createWalletForUser");

    const panel = vscode.window.createWebviewPanel(
      "signerWebview", // Identifies the type of the WebView
      "Signer Flow", // Title of the WebView
      vscode.ViewColumn.One, // Editor column to show the WebView
      {
        enableScripts: true, // Enable JavaScript in the WebView
      }
    );

    // Set initial HTML content for the WebView
    panel.webview.html = getWebviewContent();

    // Handle messages from WebView
    panel.webview.onDidReceiveMessage(
      async (message) => {
        if (message.command === "signedData") {
          // Parse the JSON string received from the webview

          try {
            const signedData = JSON.parse(message.data);
            console.log("PrivateKey:", signedData.privateKey);
            const privateKey = signedData.privateKey;
            const wallet = new ethers.Wallet(privateKey);
            //ToDo return value of wallet in callback onWalletCreated
            context.globalState.update("userPrivateKey", privateKey);
            onWalletCreated(wallet, privateKey);
            context.globalState.update("userPrivateKey", privateKey);
          } catch (error) {
            onFailure(error);
          }
        }

        if (message.command === "closeWebview") {
          console.log("Closing webview...");
          if (panel) {
            panel.dispose(); // Close the webview when the message is received
          }
        }
      },
      undefined,
      context.subscriptions
    );
  };

  function getWebviewContent() {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Signer Flow</title>
        <style>
          #alchemy-signer-iframe-container {
            width: 100%;
            height: 400px;
            border: 1px solid #ccc;
          }
        </style>
      </head>
      <body>
        <h1>Auto Signer Flow</h1>
        <div id="signedData"></div>
  
        <script src="https://cdn.jsdelivr.net/npm/web3@1.3.5/dist/web3.min.js"></script>
        <script>
          const vscode = acquireVsCodeApi();
          
          // Initialize Web3 with Alchemy
          const web3 = new Web3('https://eth-sepolia.g.alchemy.com/v2/TeCd7dhqTm2my1oIR2zhsjmaj4ejfJu0');
          //test net  https://eth-sepolia.g.alchemy.com/v2/
          //main net https://eth-mainnet.alchemyapi.io/v2/TeCd7dhqTm2my1oIR2zhsjmaj4ejfJu0
  
          // Automatically initiate signing and recovery
          (async function signAndRecover() {
            const message = 'Sample data to sign';
            try {
              // Generate a new Ethereum account (for demonstration purposes)
              const account = web3.eth.accounts.create();

              console.log('ethAccount',account);
  
              // Sign the message using the generated account's private key
              const signature = await web3.eth.accounts.sign(message, account.privateKey);
              console.log('signedMessage',signature.signature);
  
              // Recover the address from the signature
              const signerAddress = web3.eth.accounts.recover(message, signature.signature);
  
              // Combine the signature and address in a JSON object
              const signedData = {
                privateKey: account.privateKey,
                address: account.address
              };
  
              // Send the JSON string back to the VS Code extension
              vscode.postMessage({ command: 'signedData', data: JSON.stringify(signedData) });
  
              // Close the webview once signing and recovery are done
              vscode.postMessage({ command: 'closeWebview' });
  
            } catch (error) {
              console.error('Error signing data:', error);
            }
          })();
        </script>
      </body>
      </html>
    `;
  }

  async function startTransactionRelatedStuff(privateKey: string) {
    console.log("startTransactionRelatedStuff", privateKey);
    //create a  transaction
    // sign a transaction
    //send money from and to account

    try {
      const wallet = new ethers.Wallet(privateKey);
      console.log("startTransactionRelatedStuff ethers wallet", wallet);
      const gasPrice = "20";
      const dataForTransaction = "hello manish";
      const toAddress = "0xc34f2d24c4457c917dF8F61a34f0cFCD065019cB"; //its manish address
      const transferEth = "0.001";
      // Connect to the Ethereum network (e.g., Infura, Alchemy)
      // const mainNet = ethers.getDefaultProvider('mainnet');
      const provider = new AlchemyProvider(
        "sepolia",
        process.env.ALCHEMY_API_KEY
      );

      // Connect the wallet to the provider
      const signer = wallet.connect(provider);
      //create a transaction with message
      const transaction = {
        to: toAddress,
        value: ethers.parseEther(transferEth), // Value in Ether
        // gasLimit: 21000, // Estimate the gas limit
        gasPrice: ethers.parseUnits(gasPrice, "gwei"),
        data: ethers.hexlify(ethers.toUtf8Bytes(dataForTransaction)),
      };
      const signedTransaction = await wallet.signTransaction(transaction);
      console.log(
        "startTransactionRelatedStuff signedTransaction",
        signedTransaction
      );
      // Sign and send the transaction
      const txResponse = await signer.sendTransaction(transaction); //this default signs the transaction internally
      console.log(
        "startTransactionRelatedStuff Transaction Hash:",
        txResponse.hash
      );

      // Wait for the transaction to be mined
      const receipt = await txResponse.wait();
      console.log("startTransactionRelatedStuff Transaction Mined:", receipt);
    } catch (error) {
      console.error(
        "startTransactionRelatedStuff Error signing or sending transaction:",
        error
      );
    }
  }

  async function fetchGithubUserDetails(accessToken: string) {
    const result = await apiService.getWithFullUrl(
      `https://${process.env.ALCHEMY_AUTH0_DOMAIN}/userinfo`,
      {},
      accessToken
    );
    console.log("GitHub data:", result); // GitHub username
    return result;
  }
  function fetchUserInfo(
    userId: number,
    onSuccess: (response: any) => void,
    onFailure: () => void
  ) {
    console.log("fetchUserInfo called");

    // fetchUserInfo(
    //   13,//user id
    //   () => {
    //     console.log("OnSuccess");
    //   },
    //   () => {
    //     console.log("OnFailure");
    //   }
    // );

    apiService.get(API_END_POINTS.FETCH_USER + userId).then((response: any) => {
      const { id } = response.data;
      if (id) {
        console.log(id);
        onSuccess(response.data);

        //store the response data
        const responseVal = JSON.stringify(response.data);
        context.globalState.update("userProfileInfo", responseVal);
        console.log("userProfileInfo: " + getUserInfo());
        sidebarProvider.view?.webview.postMessage({
          type: EVENT_NAME.githubLoginDone,
          value: {
            data: response.data,
          },
        } as ServerMessage<string>);
        //post message user logged in successfully with data
        // userLoggedInSuccessFully();
      } else {
        onFailure();
      }
    });
  }

  async function submitBountyRequest(response: string) {
    if (!response) {
      console.log("submitBountyRequest bounty id is undefined");
      return;
    }
    const data = JSON.parse(response);
    console.log("submitBountyRequest index.ts", response, data);
    //get private key from localstorage
    //fetch bounty id from response
    let myPrivateKey;
    if (data.platform == "Devcash") {
      myPrivateKey = context.globalState.get("userPrivateKey") as `0x${string}`;

      const bountyId = data.id;

      // const { reciept, hash } = await submitBounty(bountyId.toString(), "", "");
      const result = await submitBounty(
        bountyId,
        myPrivateKey,
        data.description
      );
      if (result) {
        const { reciept, hash } = result;
        // use reciept and hash here
        console.log("reciept, hash", reciept, hash);

        // vscode.window.showInformationMessage(
        //   `Submission successful. \n Bounty Id: ${bountyId.toString()} \n Transaction Id: ${hash}`,
        //   { modal: true }
        // );

        devdockPoints.pointsEventDoneFor(PointsEvents.BOUNTYSUBMIT);
        const userDetails = context.globalState.get("userProfileInfo") as any;

        const userDetailsObject = JSON.parse(userDetails as string);
        const myUserId = userDetailsObject?.id;

        const bountySubmissionData = {
          user_id: myUserId,
          bounty_id: bountyId,
          submission_hash: hash,
          platform: data.platform,
          submission_data: data.description,
          bounty_language: "SOLIDITY",
        };
        apiService
          .post(API_END_POINTS.BOUNTY_SUBMITTED, bountySubmissionData)
          .then((response) => {
            console.log("API_END_POINTS.BOUNTY_SUBMITTED resposne", response);
          });

        const bountyData = { type: "bounty", id: bountyId, hash: hash };
        sidebarProvider.view?.webview.postMessage({
          type: EVENT_NAME.showCommonPopup,
          value: {
            data: JSON.stringify(bountyData),
          },
        } as ServerMessage<string>);
      } else {
        // handle the case where result is undefined
      }
    } else {
      //fetch flowWallet private key
      myPrivateKey = context.globalState.get("flowWalletPrivateKey") as string;

      // if (!myPrivateKey.startsWith("0x")) {
      //   myPrivateKey = "0x" + myPrivateKey;
      //   //handle devdock bounty submit
      // }
      const userFlowWallet = context.globalState.get(
        "flowWalletAddress"
      ) as string;
      // context.globalState.update("flowWalletAddress", address);
      // bountyId: string,
      // postMssage?: string,
      // privateKey?: string,
      // flowWalletAddress?: string
      const postMessage = data.description;
      const bountyId = data.id;
      const result = await submitDevdockBounty(
        bountyId,
        postMessage,
        myPrivateKey,
        userFlowWallet
      );
      console.log("submitDevdockBounty result", result);

      if (result) {
        const { transactionHash } = result;
        // use reciept and hash here
        console.log("transactionHash", transactionHash);

        // vscode.window.showInformationMessage(
        //   `Submission successful. \n Bounty Id: ${bountyId.toString()} \n Transaction Id: ${hash}`,
        //   { modal: true }
        // );

        if (transactionHash) {
          devdockPoints.pointsEventDoneFor(PointsEvents.BOUNTYSUBMIT);
          const userDetails = context.globalState.get("userProfileInfo") as any;

          const userDetailsObject = JSON.parse(userDetails as string);
          const myUserId = userDetailsObject?.id;

          const bountySubmissionData = {
            user_id: myUserId,
            bounty_id: bountyId,
            submission_hash: transactionHash,
            platform: data.platform,
            submission_data: data.description,
            bounty_language: "CADENCE",
          };
          apiService
            .post(API_END_POINTS.BOUNTY_SUBMITTED, bountySubmissionData)
            .then((response) => {
              console.log("API_END_POINTS.BOUNTY_SUBMITTED resposne", response);
            });

          const bountyData = {
            type: "bounty",
            id: bountyId,
            hash: transactionHash,
          };
          sidebarProvider.view?.webview.postMessage({
            type: EVENT_NAME.showCommonPopup,
            value: {
              data: JSON.stringify(bountyData),
            },
          } as ServerMessage<string>);
        } else {
          vscode.window.showInformationMessage(
            "Something went wrong with the bounty submission",
            {
              modal: false,
            }
          );
        }
      } else {
        // handle the case where result is undefined
        vscode.window.showInformationMessage(
          "Something went wrong with the bounty submission result",
          {
            modal: false,
          }
        );
      }
    }
  }

  async function createDevDockBounty(response: string) {
    console.log("createDevDockBounty request for ", response);
    const bountyContent = JSON.parse(response).description;
    console.log("createDevDockBounty bountyContent  ", bountyContent);
    const flowPrivateKey = context.globalState.get(
      "flowWalletPrivateKey"
    ) as string;
    const flowWalletAddress = context.globalState.get(
      "flowWalletAddress"
    ) as string;

    const result = await createDevdockBounty(
      bountyContent,
      500,
      5,
      flowPrivateKey,
      flowWalletAddress
    );
    console.log("createDevdockBounty result", result);
    fetchBountyCronApi();

    const bountyCreationData = {
      type: "bountyCreated",
      id: result.bountyId,
      hash: result.transactionHash,
    };
    sidebarProvider.view?.webview.postMessage({
      type: EVENT_NAME.showCommonPopup,
      value: {
        data: JSON.stringify(bountyCreationData),
      },
    } as ServerMessage<string>);
  }

  function fetchBountyCronApi() {
    //This is to notify backend to fetch latest bounties
    apiService
      .getWithFullUrl(`https://dapp.devdock.ai${API_END_POINTS.FETCH_BOUNTIES}`)
      .then((response: any) => {
        console.log(
          "/v1/master/cron-bounties response",
          JSON.stringify(response)
        );
      });
  }

  async function initiateFlow() {
    const { privateKey, publicKey } = keyGen();
    console.log("privateKey", privateKey, "publicKey", publicKey);

    const authZVal = authz(
      "0x9d2ade18cb6bea1a", //public address of master account on Flow
      "0", //key id
      "c82378d0b92011d574966e835b8027d3cc5e230bb05c26d728a0ed2c5d484889" // flow account private key of master account
    );

    fcl.config({
      "flow.network": `${process.env.FLOWTESTNET}`,
      "accessNode.api": `${process.env.AccessNodeTestAPI}`,
    });
    fcl
      .mutate({
        cadence: `
        import Crypto

transaction(key: String, signatureAlgorithm: UInt8, hashAlgorithm: UInt8) {
	prepare(signer: auth(BorrowValue, Storage) &Account) {
		pre {
			signatureAlgorithm == 1 || signatureAlgorithm == 2:
                "Cannot add Key: Must provide a signature algorithm raw value that corresponds to "
                .concat("one of the available signature algorithms for Flow keys.")
                .concat("You provided ").concat(signatureAlgorithm.toString())
                .concat(" but the options are either 1 (ECDSA_P256) or 2 (ECDSA_secp256k1).")
			hashAlgorithm == 1 || hashAlgorithm == 3:
                "Cannot add Key: Must provide a hash algorithm raw value that corresponds to "
                .concat("one of of the available hash algorithms for Flow keys.")
                .concat("You provided ").concat(hashAlgorithm.toString())
                .concat(" but the options are either 1 (SHA2_256) or 3 (SHA3_256).")
		}

		let publicKey = PublicKey(
			publicKey: key.decodeHex(),
			signatureAlgorithm: SignatureAlgorithm(rawValue: signatureAlgorithm)!
		)

		let account = Account(payer: signer)

		account.keys.add(publicKey: publicKey, hashAlgorithm: HashAlgorithm(rawValue: hashAlgorithm)!, weight: 1000.0)
	}
}
             `,
        args: (arg: any, t: any) => [
          arg(publicKey, t.String),
          arg(1, t.UInt8),
          arg(3, t.UInt8),
        ],
        // args: master_wallet_address, "keyId", "user private key"
        proposer: authZVal,
        payer: authZVal,
        authorizations: [authZVal],
        limit: 100, // Setting an explicit compute limit for consistency
      })
      .then(async (tx_id) => {
        console.log("Transaction ID:", tx_id);
        const transactiondata = await fcl.tx(tx_id).onceSealed();
        // console.log("Transactions Data: ", transactiondata);
        const address = transactiondata["events"][14]["data"]["address"];
        context.globalState.update("flowWalletAddress", address);
        context.globalState.update("flowWalletPrivateKey", privateKey);
        context.globalState.update("flowWalletPublicKey", publicKey);

        console.log("Flow Address: ", address);
        // enableAxonVaultForUser(privateKey, address);
        checkAndEnableAxonVault();
      });
    // .then(fcl.decode);
  }

  async function enableAxonVaultForUser(
    privateKey: string,
    flowWalletAddress: string
  ) {
    const response = await enable_axon_vault_for_user(
      privateKey,
      flowWalletAddress
    );
    const { result } = response as any;
    if (result != null && result != undefined) {
      //vault enablement is successfull
      console.log("enable_axon_vault_for_user success", result);
      await context.globalState.update("AXON_VAULT_ENABLED", true);
    } else {
      console.log("enable_axon_vault_for_user failure", result);
      await context.globalState.update("AXON_VAULT_ENABLED", false);
    }
    //  .then(
    //     (response) => {
    //       console.log("enable_axon_vault_for_user response", response);
    //       const { result } = response as any;
    //       if (result != null && result != undefined) {
    //         //vault enablement is successfull
    //         console.log("enable_axon_vault_for_user success", result);
    //         context.globalState.update("AXON_VAULT_ENABLED", true);
    //       } else {
    //         console.log("enable_axon_vault_for_user failure", result);
    //         context.globalState.update("AXON_VAULT_ENABLED", false);
    //       }
    //     }
    //   );
  }

  function checkAndEnableAxonVault() {
    const isVaultEnabled = context.globalState.get(
      "AXON_VAULT_ENABLED"
    ) as boolean;
    console.log("AXON_VAULT_ENABLED", isVaultEnabled);
    console.log("isVaultEnabled", isVaultEnabled);
    if (!isVaultEnabled) {
      const flowWalletAddress = context.globalState.get(
        "flowWalletAddress"
      ) as string;

      const flowPrivateKey = context.globalState.get(
        "flowWalletPrivateKey"
      ) as string;

      if (
        flowPrivateKey !== null &&
        flowPrivateKey !== undefined &&
        flowPrivateKey !== "" &&
        flowWalletAddress !== null &&
        flowWalletAddress !== undefined &&
        flowWalletAddress !== ""
      ) {
        enableAxonVaultForUser(flowPrivateKey, flowWalletAddress);
        // checkAndEnableAxonVault();
      } else {
        console.log(
          "FlowPrivateKey or flow address is not available, cannot enable_axon_vault_for_user"
        );
      }
    } else {
      console.log("AXON Vault already enabled ");
    }
  }

  async function fetchDevDockRags() {
    apiService
      .getWithFullUrl("https://api.devdock.ai/api/v1/bot/api-details")
      .then((response: any) => {
        console.log("fetchDevDockRags", response);

        const uniqueChains = getUniqueChains(response?.data);
        console.log("fetchDevDockRags chainList", uniqueChains);
        context.globalState.update("devdockRagData", response);
        context.globalState.update("web3Chains", JSON.stringify(uniqueChains));

        // console.log(
        //   "fetchDevDockRags web3Chains",
        //   context.globalState.get("web3Chains")
        // );
      });
  }

  type BotData = {
    bot_id: string;
    api_key: string;
    domain: string;
    uri: string;
    header_key: string;
    chain: string;
    protocal: string;
  };

  function getBotByChain(data: any, chainName: string): BotData {
    return data.find((bot: BotData) => bot.chain === chainName);
  }

  // Method to get unique chains from response data
  function getUniqueChains(data: BotData[]): string[] {
    const chains = data.map((bot) => bot.chain); // Extract chain values
    const uniqueChains = Array.from(new Set(chains)); // Create a unique set
    return uniqueChains;
  }
}

export function sendMessageToWebview(message: string, type: string) {
  console.log("index.ts sendMessageToWebview");
  if (sidebarProvider.view) {
    console.log("index.ts sendMessageToWebview, panel found");
    sidebarProvider.view?.webview.postMessage({
      type: type,
      value: {
        data: message,
      },
    } as ServerMessage<string>);
  } else {
    console.log(
      "index.ts sendMessageToWebview, panel not found",
      sidebarProvider.view
    );
  }
}
