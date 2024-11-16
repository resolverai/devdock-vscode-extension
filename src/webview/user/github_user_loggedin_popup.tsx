import React, { useEffect, useState } from 'react';

import { LOGIN_EVENT_NAME } from '../../common/constants';
import WhiteCrossSvg from '../login/white_cross_svg';
import ProfileThumbnailSVG from '../home/svgs/profile_thumbnail';
import { log } from 'console';
import { setIsLoggedIn } from '../../extension/store';
import CopyButton from '../CopyButton';

interface UserGitHubLoggedInPopupProps {
    onClose: () => void;
    loginData?: UserLoginData;
    onLogout?: () => void;
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
    wallets: WalletType[],
    my_contribution_icon_path: string,
    my_contribution_label: string,
    my_contribution_web_link: string,
    settings_icon_path: string,
    settings_label: string,
    logout_icon_path: string,
    logout_label: string,
    points: string,
    github_id: string,
};


interface WalletType {
    id: string,
    user_id: number,
    wallet_address: string,
    chain: string,
    is_deleted: boolean,
    balance: number,
    currency: string,
    created_at: string,
    updated_at: string
}


const UserGitHubLoggedInPopup: React.FC<UserGitHubLoggedInPopupProps> = ({ onClose, loginData, onLogout }) => {


    console.log("UserGitHubLoggedInPopup called", loginData);
    console.log("loginData?.profilePic", loginData?.profilePic);

    const global = globalThis as any;
    function handleGithubLogin(): void {
        console.log('This is handleSocialLogin1');
        global.vscode.postMessage({
            type: LOGIN_EVENT_NAME.initiateSocialLogin,
        });
    }

    const [userloginData, setLoginData] = useState<UserLoginData | undefined>(loginData);

    useEffect(() => {
        setLoginData(loginData); // Sync with prop updates
    }, [loginData]);


    function logoutUser(): void {
        //
        localStorage.setItem('userInfo', '');
        console.log('user logged out');
        onLogout ? onLogout() : null;
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
                    width: '290px',
                    alignContent: 'center',
                    padding: '10px',
                    borderRadius: '16px'

                }
            }>
                <div style={{ height: '10px' }}></div>
                <div style={{ display: 'flex', flexDirection: 'row', height: '36px', width: '36px', }}>
                    {


                        <div>
                            <ProfileThumbnailSVG></ProfileThumbnailSVG>
                        </div>

                    }

                    <div style={{ flex: 'display', flexDirection: 'column', alignItems: 'center', marginLeft: '8px' }}>
                        <div style={{ width: '290px' }}>Github id:<span> {loginData?.github_id}</span></div>
                        <div>
                            <div>
                                <span>
                                    {loginData?.wallets[0].wallet_address &&
                                        `${loginData.wallets[0].wallet_address.slice(0, 4)}...${loginData.wallets[0].wallet_address.slice(-5)}`}
                                </span>
                            </div>

                        </div>

                    </div>
                </div>

                <div style={{ height: '20px' }}></div>
                <div style={{ display: 'flex', flexDirection: 'row' }}>

                    <div style={{ height: '43px', display: 'flex', flexDirection: 'column' }}>
                        <div>
                            <span style={{ opacity: 0.5, fontSize: '12px', color: '#ffffff', fontWeight: 'lighter' }}>
                                DevDock points
                            </span>
                        </div>
                        <div>
                            <span style={{ opacity: 1, fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
                                {loginData?.points}
                            </span>
                        </div>

                    </div>

                    <div style={{ width: '20px' }}></div>

                    <div style={{ height: '43px', display: 'flex', flexDirection: 'column' }}>
                        <div>
                            <span style={{ opacity: 0.5, fontSize: '12px', color: '#ffffff', fontWeight: 'lighter' }}>
                                Devcash balance
                            </span>
                        </div>
                        <div>
                            <span style={{ opacity: 1, fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
                                {loginData?.balance}
                            </span>
                        </div>

                    </div>

                </div>




                <div style={{ height: '20px' }}></div>

                <div style={{ border: '2px', backgroundColor: '#292929', borderRadius: '8px', width: '258px', height: '39px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', }} >

                    <div style={{ display: 'flex', flexDirection: 'row', }}>
                        <div>
                            <span style={{ marginLeft: '5px', opacity: 1, fontSize: '12px', fontWeight: 'normal', color: '#ffffff' }}>
                                {loginData?.unclaimed_cash}
                            </span>
                        </div>
                        <div >
                            <span style={{ opacity: 0.8, fontSize: '12px', color: '#ffffff', fontWeight: 'lighter', marginLeft: '5px' }}>
                                Unclaimed Devcash
                            </span>
                        </div>
                    </div>

                    <div style={{ cursor: 'pointer' }} onClick={() => {
                        console.log('Claim now clicked, redirect it to web');
                        const url = 'https://google.com'; // Replace with your desired URL
                        // global.vscode.postMessage({ type: 'openExternal', url });
                        window.open(url, '_blank'); // Opens in a new tab


                    }}>
                        <span style={{ opacity: 1, fontSize: '12px', color: '#94FB48', fontWeight: 'normal', marginLeft: '5px', marginRight: '10px' }}>
                            Claim now
                        </span>
                    </div>

                </div>


                <div style={{ height: '20px' }}></div>
                <div style={{ height: '1px', backgroundColor: '#37373C' }}></div>
                <div style={{ height: '10px' }}></div>
                <div>
                    <span style={{ opacity: 0.5, fontSize: '12px', color: '#ffffff', fontWeight: 'lighter' }}>
                        Connected Wallets
                    </span>
                </div>


                {loginData?.wallets.map((wallet: WalletType, index) => {
                    const chain: string = wallet?.chain;

                    return (
                        <div key={index} >
                            <div style={{ height: '5px' }}></div>
                            <div style={{ display: "flex", flexDirection: 'row', }}>

                                <span style={{ opacity: 0.8, fontSize: '14px', fontWeight: 'normal', color: '#ffffff', marginRight: '10px' }}>
                                    {wallet?.currency}: {wallet?.wallet_address &&
                                        `${wallet?.wallet_address.slice(0, 4)}...${wallet?.wallet_address.slice(-5)}`}

                                </span>

                                <div>
                                    <CopyButton textToCopy={wallet?.wallet_address ?? ''}></CopyButton>
                                </div>
                            </div>
                        </div>
                    )
                })}
                {/* <div style={{ height: '20px' }}></div>
                <div>
                    <span style={{ opacity: 1, fontSize: '10px', fontWeight: 'normal', color: '#ffffff' }}>
                        EVM:0x2097490827
                    </span>
                </div>
                <div style={{ height: '20px' }}></div>
                <div>
                    <span style={{ opacity: 1, fontSize: '10px', fontWeight: 'normal', color: '#ffffff' }}>
                        Starknet:0x2097490827
                    </span>
                </div> */}
                <div style={{ height: '20px' }}></div>
                <div style={{ height: '1px', backgroundColor: '#37373C' }}></div>
                <div style={{ height: '20px' }}></div>
                <div>
                    <span style={{ opacity: 0.5, fontSize: '12px', fontWeight: 'normal', color: '#ffffff' }}>
                        My contributions
                    </span>
                </div>
                <div style={{ height: '20px' }}></div>
                {/* <div>
                    <span style={{ opacity: 1, fontSize: '12px', fontWeight: 'normal', color: '#ffffff' }}>
                        Settings
                    </span>
                </div> 
                <div style={{ height: '20px' }}></div>
                */}

                <div style={{ cursor: 'pointer' }} onClick={logoutUser}>
                    <span style={{ opacity: 1, fontSize: '12px', fontWeight: 'normal', color: '#ffffff' }}>
                        Logout
                    </span>
                </div>
                <div style={{ height: '20px' }}></div>

            </div>


        </div >
    );
};

export default UserGitHubLoggedInPopup;
