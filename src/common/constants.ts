import { defaultTemplates } from '../extension/templates'

export const EXTENSION_NAME = '@ext:rjmacarthy.devdock'
export const ASSISTANT = 'assistant'
export const USER = 'user'
export const TWINNY = '🤖 devdock'
export const SYSTEM = 'system'
export const YOU = '👤 You'
export const EMPTY_MESAGE = 'Sorry, I don’t understand. Please try again.'
export const MODEL_ERROR = 'Sorry, something went wrong...'
export const OPENING_BRACKETS = ['[', '{', '(']
export const CLOSING_BRACKETS = [']', '}', ')']
export const OPENING_TAGS = ['<']
export const CLOSING_TAGS = ['</']
export const QUOTES = ['"', '\'', '`']
export const ALL_BRACKETS = [...OPENING_BRACKETS, ...CLOSING_BRACKETS] as const
export const BRACKET_REGEX = /^[()[\]{}]+$/
export const NORMALIZE_REGEX = /\s*\r?\n|\r/g
export const LINE_BREAK_REGEX = /\r?\n|\r|\n/g
export const QUOTES_REGEX = /["'`]/g
export const MAX_CONTEXT_LINE_COUNT = 200
export const SKIP_DECLARATION_SYMBOLS = ['=']
export const IMPORT_SEPARATOR = [',', '{']
export const SKIP_IMPORT_KEYWORDS_AFTER = ['from', 'as', 'import']
export const MIN_COMPLETION_CHUNKS = 2
export const MAX_EMPTY_COMPLETION_CHARS = 250
export const DEFAULT_RERANK_THRESHOLD = 0.5

export const defaultChunkOptions = {
  maxSize: 500,
  minSize: 50,
  overlap: 50
}

export const EVENT_NAME = {
  twinngAddMessage: 'devdock-add-message',
  devdockAcceptSolution: 'devdock-accept-solution',
  devdockChat: 'devdock-chat',
  devdockChatMessage: 'devdock-chat-message',
  devdockClickSuggestion: 'devdock-click-suggestion',
  devdockConnectedToSymmetry: 'devdock-connected-to-symmetry',
  devdockConnectSymmetry: 'devdock-connect-symmetry',
  devdockDisconnectedFromSymmetry: 'devdock-disconnected-from-symmetry',
  devdockDisconnectSymmetry: 'devdock-disconnect-symmetry',
  devdockEmbedDocuments: 'devdock-embed-documents',
  devdockEnableModelDownload: 'devdock-enable-model-download',
  devdockFetchOllamaModels: 'devdock-fetch-ollama-models',
  devdockGetConfigValue: 'devdock-get-config-value',
  devdockGetGitChanges: 'devdock-get-git-changes',
  devdockGlobalContext: 'devdock-global-context',
  devdockHideBackButton: 'devdock-hide-back-button',
  devdockListTemplates: 'devdock-list-templates',
  devdockManageTemplates: 'devdock-manage-templates',
  devdockNewDocument: 'devdock-new-document',
  devdockNotification: 'devdock-notification',
  devdockOnCompletion: 'devdock-on-completion',
  devdockOnEnd: 'devdock-on-end',
  devdockOnLoading: 'devdock-on-loading',
  devdockOpenDiff: 'devdock-open-diff',
  devdockRerankThresholdChanged: 'devdock-rerank-threshold-changed',
  devdockSendLanguage: 'devdock-send-language',
  devdockSendLoader: 'devdock-send-loader',
  devdockSendSymmetryMessage: 'devdock-send-symmetry-message',
  devdockSendSystemMessage: 'devdock-send-system-message',
  devdockSendTheme: 'devdock-send-theme',
  devdockSessionContext: 'devdock-session-context',
  devdockStartSymmetryProvider: 'devdock-start-symmetry-provider',
  devdockStopSymmetryProvider: 'devdock-stop-symmetry-provider',
  devdockSetConfigValue: 'devdock-set-config-value',
  devdockSetGlobalContext: 'devdock-set-global-context',
  devdockSetOllamaModel: 'devdock-set-ollama-model',
  devdockSetSessionContext: 'devdock-set-session-context',
  devdockSetTab: 'devdock-set-tab',
  devdockGithubLogin: 'devdock-github-login',
  devdockSetWorkspaceContext: 'devdock-set-workspace-context',
  devdockStopGeneration: 'devdock-stop-generation',
  devdockTextSelection: 'devdock-text-selection',
  devdockWorkspaceContext: 'devdock-workspace-context'
}

export const DEVDOCK_COMMAND_NAME = {
  addTests: 'devdock.addTests',
  addTypes: 'devdock.addTypes',
  conversationHistory: 'devdock.conversationHistory',
  disable: 'devdock.disable',
  enable: 'devdock.enable',
  explain: 'devdock.explain',
  focusSidebar: 'devdock.sidebar.focus',
  generateDocs: 'devdock.generateDocs',
  getGitCommitMessage: 'devdock.getGitCommitMessage',
  hideBackButton: 'devdock.hideBackButton',
  manageProviders: 'devdock.manageProviders',
  githubLogin: 'devdock.githubLogin',
  githubConnect: 'devdock.githubConnect',
  listenTerminal: 'devdock.listenTerminal',
  manageTemplates: 'devdock.manageTemplates',
  newConversation: 'devdock.newConversation',
  openChat: 'devdock.openChat',
  refactor: 'devdock.refactor',
  sendTerminalText: 'devdock.sendTerminalText',
  settings: 'devdock.settings',
  stopGeneration: 'devdock.stopGeneration',
  templateCompletion: 'devdock.templateCompletion',
  templates: 'devdock.templates',
  devdockSymmetryTab: 'devdock.symmetry'
}

export const CONVERSATION_EVENT_NAME = {
  clearAllConversations: 'devdock.clear-all-conversations',
  getActiveConversation: 'devdock.get-active-conversation',
  getConversations: 'devdock.get-conversations',
  removeConversation: 'devdock.remove-conversation',
  saveConversation: 'devdock.save-conversation',
  saveLastConversation: 'devdock.save-last-conversation',
  setActiveConversation: 'devdock.set-active-conversation'
}

export const PROVIDER_EVENT_NAME = {
  addProvider: 'devdock.add-provider',
  copyProvider: 'devdock.copy-provider',
  focusProviderTab: 'devdock.focus-provider-tab',
  getActiveChatProvider: 'devdock.get-active-provider',
  getActiveEmbeddingsProvider: 'devdock.get-active-embeddings-provider',
  getActiveFimProvider: 'devdock.get-active-fim-provider',
  getAllProviders: 'devdock.get-providers',
  removeProvider: 'devdock.remove-provider',
  resetProvidersToDefaults: 'devdock.reset-providers-to-defaults',
  setActiveChatProvider: 'devdock.set-active-chat-provider',
  setActiveEmbeddingsProvider: 'devdock.set-active-embeddings-provider',
  setActiveFimProvider: 'devdock.set-active-fim-provider',
  updateProvider: 'devdock.update-provider'
}

export const LOGIN_EVENT_NAME = {
  initiateSocialLogin: 'devdock.initiate-social-login',
  completeSocialLogin: 'devdock.complete-social-login',
  errorSocialLogin: 'devdock.error-social-login'
}

export const ACTIVE_CONVERSATION_STORAGE_KEY = 'devdock.active-conversation'
export const ACTIVE_CHAT_PROVIDER_STORAGE_KEY = 'devdock.active-chat-provider'
export const ACTIVE_EMBEDDINGS_PROVIDER_STORAGE_KEY =
  'devdock.active-embeddings-provider'
export const ACTIVE_FIM_PROVIDER_STORAGE_KEY = 'devdock.active-fim-provider'
export const CONVERSATION_STORAGE_KEY = 'devdock.conversations'
export const INFERENCE_PROVIDERS_STORAGE_KEY = 'devdock.inference-providers'

export const GLOBAL_STORAGE_KEY = {
  autoConnectSymmetryProvider: 'devdock.autoConnectSymmetryProvider'
}

export const WORKSPACE_STORAGE_KEY = {
  autoScroll: 'autoScroll',
  chatMessage: 'chatMessage',
  downloadCancelled: 'downloadCancelled',
  selectedTemplates: 'selectedTemplates',
  selection: 'selection',
  showEmbeddingOptions: 'showEmbeddingOptions',
  showProviders: 'showProviders'
}

export const EXTENSION_SETTING_KEY = {
  apiProvider: 'apiProvider',
  apiProviderFim: 'apiProviderFim',
  chatModelName: 'chatModelName',
  fimModelName: 'fimModelName'
}

export const EXTENSION_CONTEXT_NAME = {
  devdockConversationHistory: 'devdockConversationHistory',
  devdockGeneratingText: 'devdockGeneratingText',
  devdockManageProviders: 'devdockManageProviders',
  devdockManageTemplates: 'devdockManageTemplates',
  devdockRerankThreshold: 'devdockRerankThreshold',
  devdockMaxChunkSize: 'devdockMaxChunkSize',
  devdockMinChunkSize: 'devdockMinChunkSize',
  devdockOverlapSize: 'devdockOverlapSize',
  devdockRelevantFilePaths: 'devdockRelevantFilePaths',
  devdockRelevantCodeSnippets: 'devdockRelevantCodeSnippets',
  devdockVectorSearchMetric: 'devdockVectorSearchMetric',
  devdockSymmetryTab: 'devdockSymmetryTab',
  devdockEnableRag: 'devdockEnableRag',
  devdockSocialLogin: 'devdockSocialLogin'
}

export const EXTENSION_SESSION_NAME = {
  devdockSymmetryConnection: 'devdockSymmetryConnection',
  devdockSymmetryConnectionProvider: 'devdockSymmetryConnectionProvider'
}

export const WEBUI_TABS = {
  chat: 'chat',
  history: 'history',
  providers: 'providers',
  settings: 'templates',
  symmetry: 'symmetry',
  login: 'login'
}

export const FIM_TEMPLATE_FORMAT = {
  automatic: 'automatic',
  codegemma: 'codegemma',
  codellama: 'codellama',
  codeqwen: 'codeqwen',
  custom: 'custom-template',
  deepseek: 'deepseek',
  llama: 'llama',
  stableCode: 'stable-code',
  starcoder: 'starcoder'
}

export const STOP_LLAMA = ['<EOT>']

export const STOP_DEEPSEEK = [
  '<｜fim▁begin｜>',
  '<｜fim▁hole｜>',
  '<｜fim▁end｜>',
  '<END>',
  '<｜end▁of▁sentence｜>'
]

export const STOP_STARCODER = ['<|endoftext|>', '<file_sep>']

export const STOP_CODEGEMMA = ['<|file_separator|>', '<|end_of_turn|>', '<eos>']

export const DEFAULT_TEMPLATE_NAMES = defaultTemplates.map(({ name }) => name)

export const DEFAULT_ACTION_TEMPLATES = [
  'refactor',
  'add-tests',
  'add-types',
  'explain'
]

export const DEFAULT_PROVIDER_FORM_VALUES = {
  apiHostname: '0.0.0.0',
  apiKey: '',
  apiPath: '',
  apiPort: 11434,
  apiProtocol: 'http',
  id: '',
  label: '',
  modelName: '',
  name: '',
  provider: 'ollama',
  type: 'chat'
}

export const TITLE_GENERATION_PROMPT_MESAGE = `
  Generate a title for this conversation in under 10 words.
  It should not contain any special characters or quotes.
`

export const WASM_LANGUAGES: { [key: string]: string } = {
  'php-s': 'php',
  bash: 'bash',
  c: 'c',
  cc: 'cpp',
  cjs: 'javascript',
  cpp: 'cpp',
  cs: 'c_sharp',
  css: 'css',
  cts: 'typescript',
  cxx: 'cpp',
  eex: 'embedded_template',
  el: 'elisp',
  elm: 'elm',
  emacs: 'elisp',
  erb: 'ruby',
  ex: 'elixir',
  exs: 'elixir',
  go: 'go',
  h: 'c',
  heex: 'embedded_template',
  hpp: 'cpp',
  htm: 'html',
  html: 'html',
  hxx: 'cpp',
  java: 'java',
  js: 'javascript',
  json: 'json',
  jsx: 'javascript',
  leex: 'embedded_template',
  lua: 'lua',
  mjs: 'javascript',
  ml: 'ocaml',
  mli: 'ocaml',
  mts: 'typescript',
  ocaml: 'ocaml',
  php: 'php',
  php3: 'php',
  php4: 'php',
  php5: 'php',
  php7: 'php',
  phps: 'php',
  phtml: 'php',
  py: 'python',
  pyi: 'python',
  pyw: 'python',
  ql: 'ql',
  rb: 'ruby',
  rdl: 'systemrdl',
  res: 'rescript',
  resi: 'rescript',
  rs: 'rust',
  sh: 'bash',
  toml: 'toml',
  ts: 'typescript',
  tsx: 'tsx',
  vue: 'vue'
}

// TODO: We could have an extendable regex for this
export const EMBEDDING_IGNORE_LIST = [
  '__mocks__',
  '__tests__',
  '.babelrc.js',
  '.babelrc.json',
  '.babelrc',
  '.circleci',
  '.classpath',
  '.dockerignore',
  '.DS_Store',
  '.eclipse',
  '.editorconfig',
  '.env.development',
  '.env.production',
  '.env.test',
  '.env',
  '.eslintignore',
  '.eslintrc.js',
  '.eslintrc.json',
  '.eslintrc',
  '.git',
  '.gitattributes',
  '.gitignore',
  '.gitlab-ci.yml',
  '.hg',
  '.idea',
  '.log',
  '.md',
  '.model',
  '.prettierrc.js',
  '.prettierrc.json',
  '.prettierrc',
  '.project',
  '.settings',
  '.storybook',
  '.stylelintrc.js',
  '.stylelintrc.json',
  '.stylelintrc',
  '.svn',
  '.swp',
  '.spm',
  '.temp',
  '.tmp',
  '.travis.yml',
  '.vscode',
  'archive',
  'archives',
  'assets',
  'backup',
  'backups',
  'bin',
  'bower_components',
  'build.gradle',
  'build',
  'CHANGELOG.md',
  'composer.json',
  'composer.lock',
  'coverage',
  'css',
  'demo',
  'demos',
  'dist',
  'doc',
  'Doc',
  'Dockerfile',
  'docs',
  'Docs',
  'documentation',
  'example',
  'examples',
  'Gemfile.lock',
  'Gemfile',
  'jenkins',
  'json',
  'LICENSE',
  'Makefile',
  'node_modules',
  'onnx',
  'out',
  'package-lock.json',
  'package.json',
  'pom.xml',
  'private',
  'Procfile',
  'public',
  'README.md',
  'release',
  'reports',
  'Resources',
  'sample',
  'samples',
  'scripts',
  'storybook-static',
  'svg',
  'target',
  'temp',
  'test-results',
  'test',
  'Test',
  'tests',
  'Tests',
  'Thumbs.db',
  'tmp',
  'tools',
  'tsconfig.json',
  'util',
  'utils',
  'vagrantfile',
  'vsix',
  'webpack.config.js',
  'yarn.lock',
  'yml'
]

export const DEFAULT_RELEVANT_FILE_COUNT = 10
export const DEFAULT_RELEVANT_CODE_COUNT = 5
export const DEFAULT_VECTOR_SEARCH_METRIC = 'l2'

export const EMBEDDING_METRICS = ['cosine', 'l2', 'dot']

export const MULTILINE_OUTSIDE = [
  'class_body',
  'class',
  'export',
  'identifier',
  'interface_body',
  'interface',
  'program'
]

export const MULTILINE_INSIDE = [
  'body',
  'export_statement',
  'formal_parameters',
  'function_definition',
  'named_imports',
  'object_pattern',
  'object_type',
  'object',
  'parenthesized_expression',
  'statement_block'
]

export const MULTILINE_TYPES = [...MULTILINE_OUTSIDE, ...MULTILINE_INSIDE]

export const MULTI_LINE_DELIMITERS = ['\n\n', '\r\n\r\n']

export const SYMMETRY_DATA_MESSAGE = {
  disconnect: 'disconnect',
  heartbeat: 'heartbeat',
  inference: 'inference',
  inferenceEnd: 'inferenceEnd',
  join: 'join',
  leave: 'leave',
  newConversation: 'newConversation',
  ping: 'ping',
  pong: 'pong',
  providerDetails: 'providerDetails',
  reportCompletion: 'reportCompletion',
  requestProvider: 'requestProvider',
  sessionValid: 'sessionValid',
  verifySession: 'verifySession'
} as const

export const SYMMETRY_EMITTER_KEY = {
  conversationTitle: 'conversationTitle',
  inference: 'inference'
}
