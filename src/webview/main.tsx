import { useEffect, useState } from 'react'
import { Chat } from './chat'
import { Settings } from './settings'
import { ServerMessage } from '../common/types'
import { EVENT_NAME, WEBUI_TABS } from '../common/constants'
import { Providers } from './providers'
import { Symmetry } from './symmetry'
import { ConversationHistory } from './conversation-history'
import { SocialLogin } from './social-login'

const tabs: Record<string, JSX.Element> = {
  [WEBUI_TABS.chat]: <Chat />,
  [WEBUI_TABS.settings]: <Settings />,
  [WEBUI_TABS.providers]: <Providers />,
  [WEBUI_TABS.symmetry]: <Symmetry />,
  [WEBUI_TABS.login]: <SocialLogin />
}

export const Main = () => {
  const [tab, setTab] = useState<string | undefined>(WEBUI_TABS.chat)

  const handler = (event: MessageEvent) => {
    const message: ServerMessage<string | undefined> = event.data
    console.log("Message received from server: ", message)
    if (message?.type === EVENT_NAME.devdockSetTab) {
      setTab(message?.value.data)
    }
    return () => window.removeEventListener('message', handler)
  }
  useEffect(() => {
    window.addEventListener('message', handler)
  }, [])

  if (!tab) {
    return null
  }

  if (tab === WEBUI_TABS.history) {
    return <ConversationHistory onSelect={() => setTab(WEBUI_TABS.chat)} />
  }

  const element: JSX.Element = tabs[tab]

  return element || null
}
