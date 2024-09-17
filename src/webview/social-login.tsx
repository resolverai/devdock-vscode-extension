import React from 'react'
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react'
import { LOGIN_EVENT_NAME } from '../common/constants'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const global = globalThis as any

export const SocialLogin = () => {

  const handleSocialLogin = () => {
    console.log("This is handleSocialLogin")
    global.vscode.postMessage({
      type: LOGIN_EVENT_NAME.initiateSocialLogin
    })
  }

  return (
    <div>
      <h3>Connect with Github to obtain a Wallet</h3>
      <VSCodeButton appearance="primary" onClick={handleSocialLogin}>
        Github Login
      </VSCodeButton>
    </div>
  )
}
