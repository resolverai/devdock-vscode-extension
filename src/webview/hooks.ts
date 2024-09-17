import { useEffect, useState } from 'react'

import {
  CONVERSATION_EVENT_NAME,
  WORKSPACE_STORAGE_KEY,
  EVENT_NAME,
  PROVIDER_EVENT_NAME,
  EXTENSION_SESSION_NAME,
  GLOBAL_STORAGE_KEY
} from '../common/constants'
import {
  ApiModel,
  ClientMessage,
  Conversation,
  LanguageType,
  ServerMessage,
  SymmetryConnection,
  ThemeType
} from '../common/types'
import { DevdockProvider } from '../extension/provider-manager'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const global = globalThis as any

export const useSelection = (onSelect?: () => void) => {
  const [selection, setSelection] = useState('')
  const handler = (event: MessageEvent) => {
    const message: ServerMessage = event.data
    if (message?.type === EVENT_NAME.devdockTextSelection) {
      setSelection(message?.value.completion.trim())
      onSelect?.()
    }
  }

  useEffect(() => {
    window.addEventListener('message', handler)
    global.vscode.postMessage({
      type: EVENT_NAME.devdockTextSelection
    })
    return () => window.removeEventListener('message', handler)
  }, [])

  return selection
}

export const useGlobalContext = <T>(key: string) => {
  const [context, setContextState] = useState<T | undefined>()

  const handler = (event: MessageEvent) => {
    const message: ServerMessage = event.data
    if (message?.type === `${EVENT_NAME.devdockGlobalContext}-${key}`) {
      setContextState(event.data.value)
    }
  }

  const setContext = (value: T) => {
    setContextState(value)
    global.vscode.postMessage({
      type: EVENT_NAME.devdockSetGlobalContext,
      key,
      data: value
    })
  }

  useEffect(() => {
    window.addEventListener('message', handler)

    global.vscode.postMessage({
      type: EVENT_NAME.devdockGlobalContext,
      key
    })

    return () => window.removeEventListener('message', handler)
  }, [])

  return { context, setContext }
}

export const useSessionContext = <T>(key: string) => {
  const [context, setContext] = useState<T>()

  const handler = (event: MessageEvent) => {
    const message: ServerMessage = event.data
    if (message?.type === `${EVENT_NAME.devdockSessionContext}-${key}`) {
      setContext(event.data.value)
    }
  }

  useEffect(() => {
    window.addEventListener('message', handler)
    global.vscode.postMessage({
      type: EVENT_NAME.devdockSessionContext,
      key
    })
    return () => window.removeEventListener('message', handler)
  }, [])

  return { context, setContext }
}

export const useWorkSpaceContext = <T>(key: string) => {
  const [context, setContext] = useState<T>()

  const handler = (event: MessageEvent) => {
    const message: ServerMessage = event.data
    if (message?.type === `${EVENT_NAME.devdockWorkspaceContext}-${key}`) {
      setContext(event.data.value)
    }
  }

  useEffect(() => {
    window.addEventListener('message', handler)
    global.vscode.postMessage({
      type: EVENT_NAME.devdockWorkspaceContext,
      key
    })

    return () => window.removeEventListener('message', handler)
  }, [])

  return { context, setContext }
}

export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeType | undefined>()
  const handler = (event: MessageEvent) => {
    const message: ServerMessage<ThemeType> = event.data
    if (message?.type === EVENT_NAME.devdockSendTheme) {
      setTheme(message?.value.data)
    }
    return () => window.removeEventListener('message', handler)
  }
  useEffect(() => {
    global.vscode.postMessage({
      type: EVENT_NAME.devdockSendTheme
    })
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])
  return theme
}

export const useLoading = () => {
  const [loader, setLoader] = useState<string | undefined>()
  const handler = (event: MessageEvent) => {
    const message: ServerMessage<string> = event.data
    if (message?.type === EVENT_NAME.devdockSendLoader) {
      setLoader(message?.value.data)
    }
    return () => window.removeEventListener('message', handler)
  }
  useEffect(() => {
    global.vscode.postMessage({
      type: EVENT_NAME.devdockSendLoader
    })
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])
  return loader
}

export const useLanguage = (): LanguageType | undefined => {
  const [language, setLanguage] = useState<LanguageType | undefined>()
  const handler = (event: MessageEvent) => {
    const message: ServerMessage = event.data
    if (message?.type === EVENT_NAME.devdockSendLanguage) {
      setLanguage(message?.value.data)
    }
    return () => window.removeEventListener('message', handler)
  }
  useEffect(() => {
    global.vscode.postMessage({
      type: EVENT_NAME.devdockSendLanguage
    })
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])
  return language
}

export const useTemplates = () => {
  const [templates, setTemplates] = useState<string[]>()
  const handler = (event: MessageEvent) => {
    const message: ServerMessage<string[]> = event.data
    if (message?.type === EVENT_NAME.devdockListTemplates) {
      setTemplates(message?.value.data)
    }
    return () => window.removeEventListener('message', handler)
  }

  const saveTemplates = (templates: string[]) => {
    global.vscode.postMessage({
      type: EVENT_NAME.devdockSetWorkspaceContext,
      key: WORKSPACE_STORAGE_KEY.selectedTemplates,
      data: templates
    } as ClientMessage<string[]>)
  }

  useEffect(() => {
    global.vscode.postMessage({
      type: EVENT_NAME.devdockListTemplates
    })
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])
  return { templates, saveTemplates }
}

export const useProviders = () => {
  const [providers, setProviders] = useState<Record<string, DevdockProvider>>({})
  const [chatProvider, setChatProvider] = useState<DevdockProvider>()
  const [fimProvider, setFimProvider] = useState<DevdockProvider>()
  const [embeddingProvider, setEmbeddingProvider] = useState<DevdockProvider>()
  const handler = (event: MessageEvent) => {
    const message: ServerMessage<
      Record<string, DevdockProvider> | DevdockProvider
    > = event.data
    if (message?.type === PROVIDER_EVENT_NAME.getAllProviders) {
      if (message.value.data) {
        const providers = message.value.data as Record<string, DevdockProvider>
        setProviders(providers)
      }
    }
    if (message?.type === PROVIDER_EVENT_NAME.getActiveChatProvider) {
      if (message.value.data) {
        const provider = message.value.data as DevdockProvider
        setChatProvider(provider)
      }
    }
    if (message?.type === PROVIDER_EVENT_NAME.getActiveFimProvider) {
      if (message.value.data) {
        const provider = message.value.data as DevdockProvider
        setFimProvider(provider)
      }
    }
    if (message?.type === PROVIDER_EVENT_NAME.getActiveEmbeddingsProvider) {
      if (message.value.data) {
        const provider = message.value.data as DevdockProvider
        setEmbeddingProvider(provider)
      }
    }
    return () => window.removeEventListener('message', handler)
  }

  const saveProvider = (provider: DevdockProvider) => {
    global.vscode.postMessage({
      type: PROVIDER_EVENT_NAME.addProvider,
      data: provider
    } as ClientMessage<DevdockProvider>)
  }

  const copyProvider = (provider: DevdockProvider) => {
    global.vscode.postMessage({
      type: PROVIDER_EVENT_NAME.copyProvider,
      data: provider
    } as ClientMessage<DevdockProvider>)
  }

  const updateProvider = (provider: DevdockProvider) => {
    global.vscode.postMessage({
      type: PROVIDER_EVENT_NAME.updateProvider,
      data: provider
    } as ClientMessage<DevdockProvider>)
  }

  const removeProvider = (provider: DevdockProvider) => {
    global.vscode.postMessage({
      type: PROVIDER_EVENT_NAME.removeProvider,
      data: provider
    } as ClientMessage<DevdockProvider>)
  }

  const setActiveFimProvider = (provider: DevdockProvider) => {
    global.vscode.postMessage({
      type: PROVIDER_EVENT_NAME.setActiveFimProvider,
      data: provider
    } as ClientMessage<DevdockProvider>)
  }

  const setActiveEmbeddingsProvider = (provider: DevdockProvider) => {
    global.vscode.postMessage({
      type: PROVIDER_EVENT_NAME.setActiveEmbeddingsProvider,
      data: provider
    } as ClientMessage<DevdockProvider>)
  }

  const setActiveChatProvider = (provider: DevdockProvider) => {
    global.vscode.postMessage({
      type: PROVIDER_EVENT_NAME.setActiveChatProvider,
      data: provider
    } as ClientMessage<DevdockProvider>)
  }

  const getProvidersByType = (type: string) => {
    return Object.values(providers).filter(
      (provider) => provider.type === type
    ) as DevdockProvider[]
  }

  const resetProviders = () => {
    global.vscode.postMessage({
      type: PROVIDER_EVENT_NAME.resetProvidersToDefaults
    } as ClientMessage<DevdockProvider>)
  }

  useEffect(() => {
    global.vscode.postMessage({
      type: PROVIDER_EVENT_NAME.getAllProviders
    })
    global.vscode.postMessage({
      type: PROVIDER_EVENT_NAME.getActiveChatProvider
    })
    global.vscode.postMessage({
      type: PROVIDER_EVENT_NAME.getActiveFimProvider
    })
    global.vscode.postMessage({
      type: PROVIDER_EVENT_NAME.getActiveEmbeddingsProvider
    })
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  return {
    chatProvider,
    copyProvider,
    embeddingProvider,
    fimProvider,
    getProvidersByType,
    providers,
    removeProvider,
    resetProviders,
    saveProvider,
    setActiveChatProvider,
    setActiveEmbeddingsProvider,
    setActiveFimProvider,
    updateProvider
  }
}

export const useConfigurationSetting = (key: string) => {
  const [configurationSetting, setConfigurationSettings] = useState<
    string | boolean | number
  >()

  const handler = (event: MessageEvent) => {
    const message: ServerMessage<string | boolean | number> = event.data
    if (
      message?.type === EVENT_NAME.devdockGetConfigValue &&
      message.value.type === key
    ) {
      setConfigurationSettings(message?.value.data)
    }
  }

  useEffect(() => {
    global.vscode.postMessage({
      type: EVENT_NAME.devdockGetConfigValue,
      key
    })
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [key])

  return { configurationSetting }
}

export const useConversationHistory = () => {
  const [conversations, setConversations] = useState<
    Record<string, Conversation>
  >({})
  const [conversation, setConversation] = useState<Conversation>()

  const getConversations = () => {
    global.vscode.postMessage({
      type: CONVERSATION_EVENT_NAME.getConversations
    } as ClientMessage<string>)
  }

  const getActiveConversation = () => {
    global.vscode.postMessage({
      type: CONVERSATION_EVENT_NAME.getActiveConversation
    })
  }

  const removeConversation = (conversation: Conversation) => {
    global.vscode.postMessage({
      type: CONVERSATION_EVENT_NAME.removeConversation,
      data: conversation
    } as ClientMessage<Conversation>)
  }

  const setActiveConversation = (conversation: Conversation | undefined) => {
    global.vscode.postMessage({
      type: CONVERSATION_EVENT_NAME.setActiveConversation,
      data: conversation
    } as ClientMessage<Conversation | undefined>)
    setConversation(conversation)
  }

  const saveLastConversation = (conversation: Conversation | undefined) => {
    global.vscode.postMessage({
      type: CONVERSATION_EVENT_NAME.saveConversation,
      data: conversation
    } as ClientMessage<Conversation>)
  }

  const clearAllConversations = () => {
    global.vscode.postMessage({
      type: CONVERSATION_EVENT_NAME.clearAllConversations
    } as ClientMessage<string>)
  }

  const handler = (event: MessageEvent) => {
    const message = event.data
    if (message.value?.data) {
      if (message?.type === CONVERSATION_EVENT_NAME.getConversations) {
        setConversations(message.value.data)
      }
      if (message?.type === CONVERSATION_EVENT_NAME.getActiveConversation) {
        setConversation(message.value.data as Conversation)
      }
    }
  }

  useEffect(() => {
    getConversations()
    getActiveConversation()
    window.addEventListener('message', handler)

    return () => window.removeEventListener('message', handler)
  }, [])

  return {
    conversations,
    conversation,
    getConversations,
    removeConversation,
    saveLastConversation,
    clearAllConversations,
    setActiveConversation
  }
}

export const useOllamaModels = () => {
  const [models, setModels] = useState<ApiModel[] | undefined>([])
  const handler = (event: MessageEvent) => {
    const message: ServerMessage<ApiModel[]> = event.data
    if (message?.type === EVENT_NAME.devdockFetchOllamaModels) {
      setModels(message?.value.data)
    }
    return () => window.removeEventListener('message', handler)
  }

  useEffect(() => {
    global.vscode.postMessage({
      type: EVENT_NAME.devdockFetchOllamaModels
    })
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  return { models }
}

const useAutosizeTextArea = (
  chatRef: React.RefObject<HTMLTextAreaElement> | null,
  value: string
) => {
  useEffect(() => {
    if (chatRef?.current) {
      chatRef.current.style.height = '0px'
      const scrollHeight = chatRef.current.scrollHeight
      chatRef.current.style.height = `${scrollHeight + 5}px`
    }
  }, [chatRef, value])
}

export const useSymmetryConnection = () => {
  const [connecting, setConnecting] = useState(false)
  const {
    context: symmetryConnectionSession,
    setContext: setSymmetryConnectionSession
  } = useSessionContext<SymmetryConnection>(
    EXTENSION_SESSION_NAME.devdockSymmetryConnection
  )

  const {
    context: symmetryProviderStatus,
    setContext: setSymmetryProviderStatus
  } = useSessionContext<string>(
    EXTENSION_SESSION_NAME.devdockSymmetryConnectionProvider
  )

  const {
    context: autoConnectProviderContext,
    setContext: setAutoConnectProviderContext
  } = useGlobalContext<boolean>(GLOBAL_STORAGE_KEY.autoConnectSymmetryProvider)

  const isProviderConnected = symmetryProviderStatus === 'connected'

  const connectToSymmetry = () => {
    setConnecting(true)
    global.vscode.postMessage({
      type: EVENT_NAME.devdockConnectSymmetry
    } as ClientMessage)
  }

  const disconnectSymmetry = () => {
    setConnecting(true)
    global.vscode.postMessage({
      type: EVENT_NAME.devdockDisconnectSymmetry
    } as ClientMessage)
  }

  const connectAsProvider = () => {
    global.vscode.postMessage({
      type: EVENT_NAME.devdockStartSymmetryProvider
    } as ClientMessage)
  }

  const disconnectAsProvider = () => {
    global.vscode.postMessage({
      type: EVENT_NAME.devdockStopSymmetryProvider
    } as ClientMessage)
  }

  const handler = (event: MessageEvent) => {
    const message: ServerMessage<SymmetryConnection | string> = event.data
    if (message?.type === EVENT_NAME.devdockConnectedToSymmetry) {
      setConnecting(false)
      setSymmetryConnectionSession(message.value.data as SymmetryConnection)
    }
    if (message?.type === EVENT_NAME.devdockDisconnectedFromSymmetry) {
      setConnecting(false)
      setSymmetryConnectionSession(undefined)
    }
    if (message?.type === EVENT_NAME.devdockSendSymmetryMessage) {
      setSymmetryProviderStatus(message?.value.data as string)
    }
    return () => window.removeEventListener('message', handler)
  }

  useEffect(() => {
    if (symmetryConnectionSession !== undefined) {
      setSymmetryConnectionSession(symmetryConnectionSession)
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  useEffect(() => {
    if (
      autoConnectProviderContext &&
      symmetryProviderStatus === 'disconnected'
    ) {
      connectAsProvider()
    }
  }, [autoConnectProviderContext, symmetryProviderStatus, connectAsProvider])


  return {
    autoConnectProviderContext,
    connectAsProvider,
    connecting,
    connectToSymmetry,
    disconnectAsProvider,
    disconnectSymmetry,
    isConnected: symmetryConnectionSession !== undefined,
    isProviderConnected,
    setAutoConnectProviderContext,
    symmetryConnection: symmetryConnectionSession,
    symmetryProviderStatus
  }
}

export default useAutosizeTextArea
