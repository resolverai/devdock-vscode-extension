import { useEffect, useState } from 'react'
import { Chat } from './chat'
import { Settings } from './settings'
import { ServerMessage } from '../common/types'
import { EVENT_NAME, WEBUI_TABS } from '../common/constants'
import { Providers } from './providers'
import { Symmetry } from './symmetry'
import { ConversationHistory } from './conversation-history'
import { SocialLogin } from './social-login'

interface MainProps {
  // onDevChatClick: () => void; // This is the function passed from Dashboard
  // onBountiesClicked: number | null; // This is the function passed from Dashboard
  tabServerMessageValue?: string;
  // topTabClickedProp: boolean;
  onTabChange?: (newTab: string) => void;

}



export const Main: React.FC<MainProps> = ({ tabServerMessageValue, onTabChange }) => {

  const tabs: Record<string, JSX.Element> = {
    // [WEBUI_TABS.chat]:
    //   <Chat
    //     topTabClickedProp={topTabClickedProp}
    //     onDevChatClick={onDevChatClick}
    //     onBountiesClicked={onBountiesClicked}
    //     isDashboardInView={isDashboardInView}
    //   />,
    [WEBUI_TABS.settings]: <Settings />,
    [WEBUI_TABS.providers]: <Providers />,
    [WEBUI_TABS.symmetry]: <Symmetry />,
    [WEBUI_TABS.login]: <SocialLogin />
  }


  // console.log(onDevChatClick, onBountiesClicked, isDashboardInView);
  const [tab, setTab] = useState<string | undefined>(WEBUI_TABS.chat)



  const handler = (event: MessageEvent) => {
    const message: ServerMessage<string | undefined> = event.data
    // console.log("Message received from server: main.tsx", message)
    if (message?.type === EVENT_NAME.devdockSetTab) {

      // setTab(message?.value?.data)
      // onDevChatClick();
    }
    return () => window.removeEventListener('message', handler)
  }
  useEffect(() => {
    window.addEventListener('message', handler)
  }, [])

  useEffect(() => {
    if (tabServerMessageValue != null && tabServerMessageValue != undefined) {
      console.log("Message received from dashboard.tsx in  main.tsx", tabServerMessageValue)
      setTab(tabServerMessageValue)
    }

  }, [tabServerMessageValue]);


  if (!tab) {
    console.log('inside not tab main.tsx');
    return null
  }

  if (tab === WEBUI_TABS.history) {
    function onSelectConversationHistory(): void {
      console.log('onSelectConversationHistory clicked', tabServerMessageValue);
      tabServerMessageValue = WEBUI_TABS.history;
      setTab(WEBUI_TABS.history)

      if (typeof onTabChange === 'function') {
        onTabChange(WEBUI_TABS.history);
      }
    }

    return <ConversationHistory onSelect={onSelectConversationHistory} />
  }
  const element: JSX.Element = tabs[tab]

  return element || null
}
