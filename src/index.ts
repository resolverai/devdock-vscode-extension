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

  createAndShowTerminal();

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
      // const web3Auth = initWeb3Auth();
      // await web3Auth?.initModal();
      socialLogin(context);
    }),

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
}
