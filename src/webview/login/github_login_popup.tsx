import React from 'react';
import GithubLoginSVG from '../home/svgs/github_login_btn';
import WhiteCrossSvg from './white_cross_svg';
import { LOGIN_EVENT_NAME } from '../../common/constants';

interface GitHubLoginPopupProps {
    onClose: () => void;
}

const GitHubLoginPopup: React.FC<GitHubLoginPopupProps> = ({ onClose }) => {
    console.log("GitHubLoginPopup called");

    const global = globalThis as any;
    function handleGithubLogin(): void {
        console.log('This is handleSocialLogin');
        global.vscode.postMessage({
            type: LOGIN_EVENT_NAME.initiateSocialLogin,
        });
    }

    return (
        <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            background: 'rgba(18, 18, 18, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '1000'

        }}>
            <div style={
                {
                    width: '350px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'end',
                    alignContent: 'flex-end',
                    backgroundColor: 'transparent',
                    padding: '15px 5px 5px 15px',
                    // marginRight: '45px',
                    // opacity: '0.1'

                }}>

                <div onClick={onClose} style={
                    {
                        display: 'flex',
                        flexDirection: 'column',
                        width: '30px',
                        backgroundColor: 'transparent',
                        alignContent: "center",
                        alignItems: 'center',
                        marginRight: '25px',

                    }}>
                    <WhiteCrossSvg></WhiteCrossSvg>
                </div>
            </div>

            <div style={
                {
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#252527',
                    height: '125px',
                    width: '290px',
                    alignContent: 'center',
                    padding: '10px',
                    borderRadius: '16px'

                }
            }>
                <div style={{ height: '10px' }}></div>
                <span style={{ color: 'white', fontSize: '12px', fontFamily: 'Inter' }}>CODE · DEPLOY · EARN</span>
                <div style={{ height: '10px' }}></div>
                <span style={{ color: 'white', fontSize: '12px', opacity: 0.7, fontFamily: 'inherit' }}>Get protocol specific dev support. Earn as you deploy contracts</span>
                <div style={{ height: '20px' }}></div>
                <div style={{ width: '100%', alignContent: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={handleGithubLogin} >
                    <GithubLoginSVG ></GithubLoginSVG>
                </div>

            </div>


        </div >
    );
};

export default GitHubLoginPopup;
