import { ExtensionContext, WebviewView } from 'vscode'
import { apiProviders, ClientMessage, ServerMessage } from '../common/types'
import {
  ACTIVE_CHAT_PROVIDER_STORAGE_KEY,
  ACTIVE_EMBEDDINGS_PROVIDER_STORAGE_KEY,
  ACTIVE_FIM_PROVIDER_STORAGE_KEY,
  FIM_TEMPLATE_FORMAT,
  INFERENCE_PROVIDERS_STORAGE_KEY,
  PROVIDER_EVENT_NAME,
  WEBUI_TABS
} from '../common/constants'
import { v4 as uuidv4 } from 'uuid'

export interface DevdockProvider {
  apiHostname: string
  apiPath: string
  apiPort: number
  apiProtocol: string
  id: string
  label: string
  modelName: string
  provider: string
  type: string
  apiKey?: string
  fimTemplate?: string
}

type Providers = Record<string, DevdockProvider> | undefined

export class ProviderManager {
  _context: ExtensionContext
  _webviewView: WebviewView

  constructor(context: ExtensionContext, webviewView: WebviewView) {
    this._context = context
    this._webviewView = webviewView
    this.setUpEventListeners()
    this.addDefaultProviders()
  }

  setUpEventListeners() {
    this._webviewView.webview.onDidReceiveMessage(
      (message: ClientMessage<DevdockProvider>) => {
        this.handleMessage(message)
      }
    )
  }

  handleMessage(message: ClientMessage<DevdockProvider>) {
    const { data: provider } = message
    switch (message.type) {
      case PROVIDER_EVENT_NAME.addProvider:
        return this.addProvider(provider)
      case PROVIDER_EVENT_NAME.removeProvider:
        return this.removeProvider(provider)
      case PROVIDER_EVENT_NAME.updateProvider:
        return this.updateProvider(provider)
      case PROVIDER_EVENT_NAME.getActiveChatProvider:
        return this.getActiveChatProvider()
      case PROVIDER_EVENT_NAME.getActiveFimProvider:
        return this.getActiveFimProvider()
      case PROVIDER_EVENT_NAME.getActiveEmbeddingsProvider:
        return this.getActiveEmbeddingsProvider()
      case PROVIDER_EVENT_NAME.setActiveChatProvider:
        return this.setActiveChatProvider(provider)
      case PROVIDER_EVENT_NAME.setActiveFimProvider:
        return this.setActiveFimProvider(provider)
      case PROVIDER_EVENT_NAME.copyProvider:
        return this.copyProvider(provider)
      case PROVIDER_EVENT_NAME.getAllProviders:
        return this.getAllProviders()
      case PROVIDER_EVENT_NAME.resetProvidersToDefaults:
        return this.resetProvidersToDefaults()
    }
  }

  public focusProviderTab = () => {
    this._webviewView?.webview.postMessage({
      type: PROVIDER_EVENT_NAME.focusProviderTab,
      value: {
        data: WEBUI_TABS.providers
      }
    } as ServerMessage<string>)
  }

  getDefaultChatProvider() {
    return {
      apiHostname: '0.0.0.0',
      apiPath: '/v1/chat/completions',
      apiPort: 11434,
      apiProtocol: 'http',
      id: uuidv4(),
      label: 'Ollama 7B Chat',
      modelName: 'codellama:7b-instruct',
      provider: apiProviders.Ollama,
      type: 'chat'
    } as DevdockProvider
  }

  getDefaultEmbeddingsProvider() {
    return {
      apiHostname: '0.0.0.0',
      apiPath: '/v1/embeddings',
      apiPort: 11434,
      apiProtocol: 'http',
      id: uuidv4(),
      label: 'Ollama Embedding',
      modelName: 'all-minilm:latest',
      provider: apiProviders.Ollama,
      type: 'embedding'
    } as DevdockProvider
  }

  getDefaultFimProvider() {
    return {
      apiHostname: '0.0.0.0',
      apiPath: '/api/generate',
      apiPort: 11434,
      apiProtocol: 'http',
      fimTemplate: FIM_TEMPLATE_FORMAT.codellama,
      label: 'Ollama 7B FIM',
      id: uuidv4(),
      modelName: 'codellama:7b-code',
      provider: apiProviders.Ollama,
      type: 'fim'
    } as DevdockProvider
  }

  addDefaultProviders() {
    this.addDefaultChatProvider()
    this.addDefaultFimProvider()
    this.addDefaultEmbeddingsProvider()
  }

  addDefaultChatProvider(): DevdockProvider {
    const provider = this.getDefaultChatProvider()
    if (!this._context.globalState.get(ACTIVE_CHAT_PROVIDER_STORAGE_KEY)) {
      this.addDefaultProvider(provider)
    }
    return provider
  }

  addDefaultFimProvider(): DevdockProvider {
    const provider = this.getDefaultFimProvider()
    if (!this._context.globalState.get(ACTIVE_FIM_PROVIDER_STORAGE_KEY)) {
      this.addDefaultProvider(provider)
    }
    return provider
  }

  addDefaultEmbeddingsProvider(): DevdockProvider {
    const provider = this.getDefaultEmbeddingsProvider()
    if (
      !this._context.globalState.get(ACTIVE_EMBEDDINGS_PROVIDER_STORAGE_KEY)
    ) {
      this.addDefaultProvider(provider)
    }
    return provider
  }

  addDefaultProvider(provider: DevdockProvider): void {
    if (provider.type === 'chat') {
      this._context.globalState.update(
        ACTIVE_CHAT_PROVIDER_STORAGE_KEY,
        provider
      )
    } else if (provider.type === 'fim') {
      this._context.globalState.update(
        ACTIVE_FIM_PROVIDER_STORAGE_KEY,
        provider
      )
    } else {
      this._context.globalState.update(
        ACTIVE_EMBEDDINGS_PROVIDER_STORAGE_KEY,
        provider
      )
    }
    this.addProvider(provider)
  }

  getProviders(): Providers {
    const providers = this._context.globalState.get<
      Record<string, DevdockProvider>
    >(INFERENCE_PROVIDERS_STORAGE_KEY)
    return providers
  }

  getAllProviders() {
    const providers = this.getProviders() || {}
    this._webviewView.webview.postMessage({
      type: PROVIDER_EVENT_NAME.getAllProviders,
      value: {
        data: providers
      }
    })
  }

  getActiveChatProvider() {
    const provider = this._context.globalState.get<DevdockProvider>(
      ACTIVE_CHAT_PROVIDER_STORAGE_KEY
    )
    this._webviewView.webview.postMessage({
      type: PROVIDER_EVENT_NAME.getActiveChatProvider,
      value: {
        data: provider
      }
    })
    return provider
  }

  getActiveFimProvider() {
    const provider = this._context.globalState.get<DevdockProvider>(
      ACTIVE_FIM_PROVIDER_STORAGE_KEY
    )
    this._webviewView.webview.postMessage({
      type: PROVIDER_EVENT_NAME.getActiveFimProvider,
      value: {
        data: provider
      }
    })
    return provider
  }

  getActiveEmbeddingsProvider() {
    const provider = this._context.globalState.get<DevdockProvider>(
      ACTIVE_EMBEDDINGS_PROVIDER_STORAGE_KEY
    )
    this._webviewView.webview.postMessage({
      type: PROVIDER_EVENT_NAME.getActiveEmbeddingsProvider,
      value: {
        data: provider
      }
    })
    return provider
  }

  setActiveChatProvider(provider?: DevdockProvider) {
    if (!provider) return
    this._context.globalState.update(ACTIVE_CHAT_PROVIDER_STORAGE_KEY, provider)
    return this.getActiveChatProvider()
  }

  setActiveFimProvider(provider?: DevdockProvider) {
    if (!provider) return
    this._context.globalState.update(ACTIVE_FIM_PROVIDER_STORAGE_KEY, provider)
    return this.getActiveFimProvider()
  }

  setActiveEmbeddingsProvider(provider?: DevdockProvider) {
    if (!provider) return
    this._context.globalState.update(
      ACTIVE_EMBEDDINGS_PROVIDER_STORAGE_KEY,
      provider
    )
    return this.getActiveEmbeddingsProvider()
  }

  addProvider(provider?: DevdockProvider) {
    const providers = this.getProviders() || {}
    if (!provider) return
    provider.id = uuidv4()
    providers[provider.id] = provider
    this._context.globalState.update(INFERENCE_PROVIDERS_STORAGE_KEY, providers)
    this.getAllProviders()
  }

  copyProvider(provider?: DevdockProvider) {
    if (!provider) return
    provider.id = uuidv4()
    provider.label = `${provider.label}-copy`
    this.addProvider(provider)
  }

  removeProvider(provider?: DevdockProvider) {
    const providers = this.getProviders() || {}
    if (!provider) return
    delete providers[provider.id]
    this._context.globalState.update(INFERENCE_PROVIDERS_STORAGE_KEY, providers)
    this.getAllProviders()
  }

  updateProvider(provider?: DevdockProvider) {
    const providers = this.getProviders() || {}
    const activeFimProvider = this.getActiveFimProvider()
    const activeChatProvider = this.getActiveChatProvider()
    if (!provider) return
    providers[provider.id] = provider
    this._context.globalState.update(INFERENCE_PROVIDERS_STORAGE_KEY, providers)
    if (provider.id === activeFimProvider?.id)
      this.setActiveFimProvider(provider)
    if (provider.id === activeChatProvider?.id)
      this.setActiveChatProvider(provider)
    this.getAllProviders()
  }

  resetProvidersToDefaults(): void {
    this._context.globalState.update(INFERENCE_PROVIDERS_STORAGE_KEY, undefined)
    this._context.globalState.update(
      ACTIVE_CHAT_PROVIDER_STORAGE_KEY,
      undefined
    )
    this._context.globalState.update(
      ACTIVE_EMBEDDINGS_PROVIDER_STORAGE_KEY,
      undefined
    )
    this._context.globalState.update(ACTIVE_FIM_PROVIDER_STORAGE_KEY, undefined)
    const chatProvider = this.addDefaultChatProvider()
    const fimProvider = this.addDefaultFimProvider()
    const embeddingsProvider = this.addDefaultEmbeddingsProvider()
    this.focusProviderTab()
    this.setActiveChatProvider(chatProvider)
    this.setActiveFimProvider(fimProvider)
    this.setActiveEmbeddingsProvider(embeddingsProvider)
    this.getAllProviders()
  }
}
