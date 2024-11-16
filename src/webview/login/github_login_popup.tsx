import React from 'react';
import GithubLoginSVG from '../home/svgs/github_login_btn';
import WhiteCrossSvg from './white_cross_svg';
import { LOGIN_EVENT_NAME } from '../../common/constants';

interface GitHubLoginPopupProps {
    onClose: () => void;
    loginData?: UserLoginData;
}

type UserLoginData = {
    profilePic: string,
    profileLabel: string,
    topWalletAddress: string,
    balance_lable: string,
    balance: number,
    unclaimed_cash_label: string,
    unclaimed_cash: number,
    claim_now_cta_text: string,
    other_Wallets_label: string,
    wallets: string[],
    my_contribution_icon_path: string,
    my_contribution_label: string,
    my_contribution_web_link: string,
    settings_icon_path: string,
    settings_label: string,
    logout_icon_path: string,
    logout_label: string,
    github_id: string,
};

const GitHubLoginPopup: React.FC<GitHubLoginPopupProps> = ({ onClose, loginData }) => {
    console.log("GitHubLoginPopup called", loginData);

    const global = globalThis as any;
    function handleGithubLogin(): void {
        console.log('This is handleSocialLogin2');
        global.vscode.postMessage({
            type: LOGIN_EVENT_NAME.initiateSocialLogin,
        });
        onClose();
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
