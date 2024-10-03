import React from 'react';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { LOGIN_EVENT_NAME } from '../common/constants';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const global = globalThis as any;

export const SocialLogin: React.FC = () => {
  const handleSocialLogin = () => {
    console.log('This is handleSocialLogin');
    global.vscode.postMessage({
      type: LOGIN_EVENT_NAME.initiateSocialLogin,
    });
  };

  return (
    <div style={containerStyle}>
      <h3 style={headingStyle}>Connect with Github to obtain a Wallet</h3>
      <VSCodeButton appearance="primary" onClick={handleSocialLogin}>
        Github Login
      </VSCodeButton>

    </div>


  );
};

// Define styles as CSSProperties to ensure compatibility with TypeScript
const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '95vh', // Full viewport height for vertical centering
  textAlign: 'center',

};

const headingStyle: React.CSSProperties = {
  marginBottom: '20px',
};

export default SocialLogin;
