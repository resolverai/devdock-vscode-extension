import { useCallback, useEffect, useRef, useState } from 'react'

import {
  VSCodeButton,
  VSCodePanelView,
  VSCodeBadge,
  VSCodeDivider
} from '@vscode/webview-ui-toolkit/react'
import { useEditor, EditorContent, Extension, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Mention, { MentionPluginKey } from '@tiptap/extension-mention'

import {
  ASSISTANT,
  WORKSPACE_STORAGE_KEY,
  EVENT_NAME,
  USER,
  SYMMETRY_EMITTER_KEY,
  EXTENSION_CONTEXT_NAME
} from '../common/constants'

import useAutosizeTextArea, {
  useConversationHistory,
  useSelection,
  useSymmetryConnection,
  useTheme,
  useWorkSpaceContext
} from './hooks'
import {
  DisabledAutoScrollIcon,
  DisabledRAGIcon,
  EnabledAutoScrollIcon,
  EnabledRAGIcon
} from './icons'

import { Suggestions } from './suggestions'
import {
  ClientMessage,
  Message as MessageType,
  ServerMessage
} from '../common/types'
import { Message } from './message'
import { getCompletionContent } from './utils'
import { ProviderSelect } from './provider-select'
import { EmbeddingOptions } from './embedding-options'
import ChatLoader from './chat-loader'
import { suggestion } from './suggestion'
import styles from './index.module.css'
import EventSender from './EventSender'
import { AnalyticsEvents } from '../common/analyticsEventKeys'

interface ChatProps {
  onDevChatClick: () => void; // This is the function passed from Dashboard
  onBountiesClicked: () => void; // This is the function passed from Dashboard
  isDashboardInView: boolean;
}

const CustomKeyMap = Extension.create({
  name: 'chatKeyMap',

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const mentionState = MentionPluginKey.getState(editor.state)
        if (mentionState && mentionState.active) {
          return false
        }
        this.options.handleSubmitForm()
        this.options.clearEditor()
        return true
      },
      'Mod-Enter': ({ editor }) => {
        editor.commands.insertContent('\n')
        return true
      },
      'Shift-Enter': ({ editor }) => {
        editor.commands.insertContent('\n')
        return true
      }
    }
  }
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const global = globalThis as any
export const Chat: React.FC<ChatProps> = ({ onDevChatClick, onBountiesClicked, isDashboardInView }) => {
  const generatingRef = useRef(false)
  const editorRef = useRef<Editor | null>(null)
  const stopRef = useRef(false)
  const theme = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<MessageType[] | undefined>()
  const [completion, setCompletion] = useState<MessageType | null>()
  const markdownRef = useRef<HTMLDivElement>(null)
  const { symmetryConnection } = useSymmetryConnection()

  const { context: autoScrollContext, setContext: setAutoScrollContext } =
    useWorkSpaceContext<boolean>(WORKSPACE_STORAGE_KEY.autoScroll)
  const { context: showProvidersContext, setContext: setShowProvidersContext } =
    useWorkSpaceContext<boolean>(WORKSPACE_STORAGE_KEY.showProviders)
  const {
    context: showEmbeddingOptionsContext,
    setContext: setShowEmbeddingOptionsContext
  } = useWorkSpaceContext<boolean>(WORKSPACE_STORAGE_KEY.showEmbeddingOptions)
  const { conversation, saveLastConversation, setActiveConversation } =
    useConversationHistory()

  const { context: enableRagContext, setContext: setEnableRagContext } =
    useWorkSpaceContext<boolean>(EXTENSION_CONTEXT_NAME.devdockEnableRag)

  const chatRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    if (!autoScrollContext) return
    setTimeout(() => {
      if (markdownRef.current) {
        markdownRef.current.scrollTop = markdownRef.current.scrollHeight
      }
    }, 200)
  }

  const selection = useSelection(scrollToBottom)

  const handleCompletionEnd = (message: ServerMessage) => {
    if (message.value) {
      setMessages((prev) => {
        const messages = [
          ...(prev || []),
          {
            role: ASSISTANT,
            content: getCompletionContent(message)
          }
        ]

        if (message.value.type === SYMMETRY_EMITTER_KEY.conversationTitle) {
          return messages
        }

        saveLastConversation({
          ...conversation,
          messages: messages
        })
        return messages
      })
      setTimeout(() => {
        editor?.commands.focus()
        stopRef.current = false
      }, 200)
    }
    setCompletion(null)
    setIsLoading(false)
    generatingRef.current = false
  }

  const handleAddTemplateMessage = (message: ServerMessage) => {
    if (stopRef.current) {
      generatingRef.current = false
      return
    }
    generatingRef.current = true
    setIsLoading(false)
    scrollToBottom()
    setMessages((prev) => [
      ...(prev || []),
      {
        role: USER,
        content: message.value.completion as string
      }
    ])
  }

  const handleCompletionMessage = (message: ServerMessage) => {
    if (stopRef.current) {
      generatingRef.current = false
      return
    }
    generatingRef.current = true
    setCompletion({
      role: ASSISTANT,
      content: getCompletionContent(message),
      type: message.value.type,
      language: message.value.data,
      error: message.value.error
    })
    scrollToBottom()
  }

  const handleLoadingMessage = () => {
    setIsLoading(true)
    if (autoScrollContext) scrollToBottom()
  }

  const messageEventHandler = (event: MessageEvent) => {
    const message: ServerMessage = event.data
    switch (message.type) {
      case EVENT_NAME.twinngAddMessage: {
        handleAddTemplateMessage(message)
        break
      }
      case EVENT_NAME.devdockOnCompletion: {
        handleCompletionMessage(message)
        break
      }
      case EVENT_NAME.devdockOnLoading: {
        handleLoadingMessage()
        break
      }
      case EVENT_NAME.devdockOnEnd: {
        handleCompletionEnd(message)
        break
      }
      case EVENT_NAME.devdockStopGeneration: {
        setCompletion(null)
        generatingRef.current = false
        setIsLoading(false)
        chatRef.current?.focus()
        setActiveConversation(undefined)
        setMessages([])
        setTimeout(() => {
          stopRef.current = false
        }, 1000)
      }
    }
  }

  const handleStopGeneration = () => {
    stopRef.current = true
    generatingRef.current = false
    global.vscode.postMessage({
      type: EVENT_NAME.devdockStopGeneration
    } as ClientMessage)
    setCompletion(null)
    setIsLoading(false)
    setMessages([])
    generatingRef.current = false
    setTimeout(() => {
      chatRef.current?.focus()
      stopRef.current = false
    }, 200)
  }

  const handleRegenerateMessage = (index: number): void => {
    setIsLoading(true)
    setMessages((prev) => {
      if (!prev) return prev
      const updatedMessages = prev.slice(0, index)

      global.vscode.postMessage({
        type: EVENT_NAME.devdockChatMessage,
        data: updatedMessages
      } as ClientMessage)

      return updatedMessages
    })
  }

  const handleDeleteMessage = (index: number): void => {
    setMessages((prev) => {
      if (!prev || prev.length === 0) return prev

      if (prev.length === 2) return prev

      const updatedMessages = [
        ...prev.slice(0, index),
        ...prev.slice(index + 2)
      ]

      saveLastConversation({
        ...conversation,
        messages: updatedMessages
      })

      return updatedMessages
    })
  }

  const handleEditMessage = (message: string, index: number): void => {
    setIsLoading(true)
    setMessages((prev) => {
      if (!prev) return prev

      const updatedMessages = [
        ...prev.slice(0, index),
        { ...prev[index], content: message }
      ]

      global.vscode.postMessage({
        type: EVENT_NAME.devdockChatMessage,
        data: updatedMessages
      } as ClientMessage)

      return updatedMessages
    })
  }

  const handleSubmitForm = () => {
    onDevChatClick();
    const input = editor?.getText()
    if (input) {
      setIsLoading(true)
      clearEditor()
      setMessages((prevMessages) => {
        const updatedMessages = [
          ...(prevMessages || []),
          { role: USER, content: input }
        ]
        global.vscode.postMessage({
          type: EVENT_NAME.devdockChatMessage,
          data: updatedMessages
        } as ClientMessage)
        return updatedMessages
      })

      setTimeout(() => {
        if (markdownRef.current) {
          markdownRef.current.scrollTop = markdownRef.current.scrollHeight
        }
      }, 200)
    }
  }
  const handleAddFocusButton = () => {
    onBountiesClicked();
    onDevChatClick();
  }

  const clearEditor = useCallback(() => {
    editorRef.current?.commands.clearContent()
  }, [])

  const handleToggleAutoScroll = () => {
    setAutoScrollContext((prev) => {
      global.vscode.postMessage({
        type: EVENT_NAME.devdockSetWorkspaceContext,
        key: WORKSPACE_STORAGE_KEY.autoScroll,
        data: !prev
      } as ClientMessage)

      if (!prev) scrollToBottom()

      return !prev
    })

    const toggleData = { autoScrollEnabled: false };
    if (!autoScrollContext) {
      toggleData.autoScrollEnabled = true;
    } else {
      toggleData.autoScrollEnabled = false;
    }
    EventSender.sendEvent(AnalyticsEvents.CPToggleButtonClicked, toggleData);
  }

  const handleToggleProviderSelection = () => {
    setShowProvidersContext((prev) => {
      global.vscode.postMessage({
        type: EVENT_NAME.devdockSetWorkspaceContext,
        key: WORKSPACE_STORAGE_KEY.showProviders,
        data: !prev
      } as ClientMessage)
      return !prev
    })
    const toggleProvider = { activeProvideEnabled: false };
    if (!showProvidersContext) {
      toggleProvider.activeProvideEnabled = true;
    } else {
      toggleProvider.activeProvideEnabled = false;
    }
    EventSender.sendEvent(AnalyticsEvents.CPSelectActiveProvidersClicked, toggleProvider);
  }

  const handleToggleEmbeddingOptions = () => {
    setShowEmbeddingOptionsContext((prev) => {
      global.vscode.postMessage({
        type: EVENT_NAME.devdockSetWorkspaceContext,
        key: WORKSPACE_STORAGE_KEY.showEmbeddingOptions,
        data: !prev
      } as ClientMessage)
      return !prev
    })


    const toggleEmbeddedOptions = { isEmbeddedOptionsEnabled: false };
    if (!showEmbeddingOptionsContext) {
      toggleEmbeddedOptions.isEmbeddedOptionsEnabled = true;
    } else {
      toggleEmbeddedOptions.isEmbeddedOptionsEnabled = false;
    }
    EventSender.sendEvent(AnalyticsEvents.CPEmbeddingOptionsClicked, toggleEmbeddedOptions);
  }

  const handleGetGitChanges = () => {
    global.vscode.postMessage({
      type: EVENT_NAME.devdockGetGitChanges
    } as ClientMessage)

    EventSender.sendEvent(AnalyticsEvents.CPGenerateCommitClicked);
  }

  const handleScrollBottom = () => {
    if (markdownRef.current) {
      markdownRef.current.scrollTop = markdownRef.current.scrollHeight
    }
    EventSender.sendEvent(AnalyticsEvents.CPScrollDownClicked);
  }

  const handleToggleRag = (): void => {
    setEnableRagContext((prev) => {
      global.vscode.postMessage({
        type: EVENT_NAME.devdockSetWorkspaceContext,
        key: EXTENSION_CONTEXT_NAME.devdockEnableRag,
        data: !prev
      } as ClientMessage)
      return !prev
    })
    const isRagEnabledObject = { isEnabled: false }

    if (!enableRagContext) {
      isRagEnabledObject.isEnabled = true;
    } else {
      isRagEnabledObject.isEnabled = false;
    }
    EventSender.sendEvent(AnalyticsEvents.CPisRAGContextClickedEnabled, isRagEnabledObject);
  }

  useEffect(() => {
    window.addEventListener('message', messageEventHandler)
    editor?.commands.focus()
    scrollToBottom()
    return () => {
      window.removeEventListener('message', messageEventHandler)
    }
  }, [autoScrollContext])

  useEffect(() => {
    if (conversation?.messages?.length) {
      return setMessages(conversation.messages)
    }
  }, [conversation?.id, autoScrollContext, showProvidersContext])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'How can devdock help you today?'
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention'
        },
        suggestion
      }),
      CustomKeyMap.configure({
        handleSubmitForm,
        clearEditor
      })
    ]
  })

  useAutosizeTextArea(chatRef, editor?.getText() || '')

  if (editor && !editorRef.current) {
    editorRef.current = editor
  }

  return (
    <VSCodePanelView >
      <div style={
        {
          display: 'flex',
          flexDirection: 'column',
          height: 'auto',
          width: '90%',
          margin: '4px',
          position: 'fixed',
          // flexGrow: 1, // Allow this container to grow and push container 3 to the bottom
          overflowY: 'auto',
          bottom: 0,
          alignContent: 'center'

        }
      }>
        <h4
          // className={styles.title}
          style={{

          }}
        >
          {conversation?.title
            ? conversation?.title
            : generatingRef.current && <span>New conversation</span>}
        </h4>
        <div className={styles.markdown} ref={markdownRef}>
          {!isDashboardInView && messages?.map((message, index) => (
            <Message
              key={index}
              onRegenerate={handleRegenerateMessage}
              onUpdate={handleEditMessage}
              onDelete={handleDeleteMessage}
              isLoading={isLoading || generatingRef.current}
              isAssistant={index % 2 !== 0}
              conversationLength={messages?.length}
              message={message}
              theme={theme}
              index={index}
            />
          ))}
          {!isDashboardInView && isLoading && !generatingRef.current && <ChatLoader />}
          {!!completion && (
            <Message
              isLoading={false}
              isAssistant
              theme={theme}
              message={{
                ...completion,
                role: ASSISTANT
              }}
            />
          )}
        </div>
        {!!selection.length && (
          <Suggestions isDisabled={!!generatingRef.current} />
        )}
        {showProvidersContext && !symmetryConnection && <ProviderSelect />}
        {showProvidersContext && showEmbeddingOptionsContext && (
          <VSCodeDivider />
        )}
        {showEmbeddingOptionsContext && !symmetryConnection && (
          <EmbeddingOptions />
        )}
        <div className={styles.chatOptions}>
          <div>
            <VSCodeButton
              onClick={handleToggleAutoScroll}
              title="Toggle auto scroll on/off"
              appearance="icon"
            >
              {autoScrollContext ? (
                <EnabledAutoScrollIcon />
              ) : (
                <DisabledAutoScrollIcon />
              )}
            </VSCodeButton>
            <VSCodeButton
              onClick={handleGetGitChanges}
              title="Generate commit message from staged changes"
              appearance="icon"
            >
              <span className="codicon codicon-git-pull-request"></span>
            </VSCodeButton>
            <VSCodeButton
              title="Scroll down to the bottom"
              appearance="icon"
              onClick={handleScrollBottom}
            >
              <span className="codicon codicon-arrow-down"></span>
            </VSCodeButton>
            <VSCodeButton
              title="Enable/disable RAG context for all messages"
              appearance="icon"
              onClick={handleToggleRag}
            >
              {enableRagContext ? <EnabledRAGIcon /> : <DisabledRAGIcon />}
            </VSCodeButton>
            <VSCodeBadge>{selection?.length}</VSCodeBadge>
          </div>
          <div>
            {generatingRef.current && (
              <VSCodeButton
                type="button"
                appearance="icon"
                onClick={handleStopGeneration}
                aria-label="Stop generation"
              >
                <span className="codicon codicon-debug-stop"></span>
              </VSCodeButton>
            )}
            {!symmetryConnection && (
              <>
                <VSCodeButton
                  title="Embedding options"
                  appearance="icon"
                  onClick={handleToggleEmbeddingOptions}
                >
                  <span className="codicon codicon-database"></span>
                </VSCodeButton>
                <VSCodeButton
                  title="Select active providers"
                  appearance="icon"
                  onClick={handleToggleProviderSelection}
                >
                  <span className={styles.textIcon}>🤖</span>
                </VSCodeButton>
              </>
            )}
            {!!symmetryConnection && (
              <a
                href={`https://twinny.dev/symmetry/?id=${symmetryConnection.id}`}
              >
                <VSCodeBadge
                  title={`Connected to symmetry network provider ${symmetryConnection?.name}, model ${symmetryConnection?.modelName}, provider ${symmetryConnection?.provider}`}
                >
                  ⚡️ {symmetryConnection?.name}
                </VSCodeBadge>
              </a>
            )}
          </div>
        </div>
        <form>
          <div className={styles.chatBox}>
            <EditorContent
              placeholder="How can devdock help you today?"
              className={styles.tiptap}
              editor={editor}
            />

            <div style={{ display: 'flex', flexDirection: 'row', alignContent: 'space-between' }}>
              <div
                role="button"
                onClick={handleAddFocusButton}
                className={styles.chatSubmit}
                style={{

                  height: '24px',
                  display: 'flex',
                  width: '75px',
                  flexDirection: 'row',

                  background: 'linear-gradient(90deg, #292929 0%, #292929 100%)',
                  borderRadius: '30px',
                  fontSize: '10px',
                  paddingTop: '5px',
                  paddingLeft: '10px',
                  left: '5px',
                  position: 'absolute',
                  cursor: 'pointer',
                  bottom: '2px'


                }}
              >

                <div>
                  @ Add Focus
                </div>



              </div>
              <div
                role="button"
                onClick={handleSubmitForm}
                className={styles.chatSubmit}
                style={{

                  height: '24px',
                  display: 'flex',
                  width: '64px',
                  flexDirection: 'row',

                  background: 'linear-gradient(90deg, #3172FC 0%, #5738BE 100%)',
                  borderRadius: '30px',
                  paddingTop: '5px',
                  paddingLeft: '20px',
                  right: '5px',
                  position: 'absolute',
                  cursor: 'pointer',
                  bottom: '2px'


                }}
              >

                <div>
                  Ask
                </div>
                <div style={{ width: '5px' }}>

                </div>
                <div>
                  <span className="codicon codicon-send"></span>
                </div>

              </div>
            </div>


          </div>
        </form>
      </div>
    </VSCodePanelView >
  )
}

