import React, { useState } from 'react'
import './container.css'
import ExpandableCardList from '../expandableCardList';
import HamberIcon from './svgs/hanberger_icon';
import DevDockLogoSVG from './svgs/devdock_logo';
import ProfileIcon from './svgs/profile_icon';
import { Main } from '../main';
import { Chat } from '../chat';
import GitHubLoginPopup from '../login/github_login_popup';
import UserGitHubLoggedInPopup from '../user/github_user_loggedin_popup';


const Dashboard: React.FC = () => {

    const [bountiesClicked, setBountiesClicked] = useState<boolean>(true);
    const [isUserLoggedIn, setUserLoggedin] = useState<boolean>(false);
    const [isGitHubPopupVisible, setGitHubPopupVisible] = useState(false);
    const [showLoggedInUserPopup, setLoggedInPoupVisibile] = useState(false);


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
    };

    const userLoginData: UserLoginData = {
        profilePic: '',
        profileLabel: 'Github_id',
        topWalletAddress: '0x5852...8Fe1',
        balance_lable: 'Devcash balance',
        balance: 375,
        unclaimed_cash_label: 'Unclaimed Devcash',
        unclaimed_cash: 4432,
        claim_now_cta_text: 'Claim now',
        other_Wallets_label: 'Other wallets connected',
        wallets: ['EVM: 0x83s5...d89s', 'Starknet: 0cujsw...98da'],
        my_contribution_icon_path: '',
        my_contribution_label: 'My contributions',
        my_contribution_web_link: '',
        settings_icon_path: '',
        settings_label: 'Settings',
        logout_icon_path: '',
        logout_label: 'Logout',
    };


    const showPopupForUser = () => {


        if (isUserLoggedIn && showLoggedInUserPopup) {
            console.log('isUserLoggedIn', isUserLoggedIn, userLoginData);
            return (
                <UserGitHubLoggedInPopup onClose={closeUserGithubPopup} loginData={userLoginData}></UserGitHubLoggedInPopup>
            );
        }
        if (!isUserLoggedIn && isGitHubPopupVisible) {
            console.log('!isUserLoggedIn', isUserLoggedIn);
            return (
                <GitHubLoginPopup onClose={closeGithubLoginPopup}></GitHubLoginPopup>
            );

        }
        // <UserInfo onClose={closeGithubLoginPopup} loginData={userLoginData}></UserInfo>



        return <></>;
    }




    const handleBountiesClick = () => {
        console.log('Bounties clicked!');
        // Set both bounties and devdockChat opacity to 0.5 when bounties is clicked
        setBountiesClicked(true);


    };

    const devdockChatButtonClicked = () => {
        console.log('Devdock chat clicked!');
        // Set both bounties and devdockChat opacity to 0.5 when devdockChat is clicked
        setBountiesClicked(false);


    };

    const handleProfileIconClick = () => {
        console.log('profile icon clicked');
        if (isUserLoggedIn) {
            //show Github login
            setLoggedInPoupVisibile(true)
        } else {
            setGitHubPopupVisible(true);
        }
    }

    // Function to close the popup
    const closeGithubLoginPopup = () => {
        setGitHubPopupVisible(false);
    };
    const closeUserGithubPopup = () => {
        setLoggedInPoupVisibile(false);

    };

    {

        return (
            <div
                style={{
                    display: 'flex',
                    backgroundColor: '#181818',
                    height: 'auto',
                    flexDirection: 'column',
                    flexGrow: 1, // Allow this container to grow and push container 3 to the bottom
                    overflowY: 'auto',
                }} >

                {showPopupForUser()}
                <div style={{ height: 10, width: '100%' }}></div>
                <div className="horizontal-container">


                    <div style={{ height: '18px' }}>
                        <HamberIcon />
                    </div>
                    <div style={{ height: '18px' }}>
                        <DevDockLogoSVG />
                    </div>
                    <div style={{ height: '18px' }} onClick={handleProfileIconClick}>
                        <ProfileIcon />
                    </div>


                </div>
                <div style={{ height: 10, width: '100%' }}></div>
                <div style={{ height: 1, width: '100%', backgroundColor: "#212121" }}></div>
                <div style={{ height: 10, width: '100%' }}></div>
                <div>
                    <div style={{ display: 'flex', flexDirection: 'row', alignContent: "start", }}>
                        <div
                            style={{
                                border: '1px solid white',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                backgroundColor: '#252527',
                                cursor: 'pointer', // Change cursor to pointer to indicate clickability
                                opacity: bountiesClicked ? 1 : 0.5
                            }}
                            onClick={handleBountiesClick} // Add onClick handler
                        >
                            Bounties
                        </div>
                        <div style={{ width: 10 }}></div>
                        <div
                            style={{
                                border: '1px solid white',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                backgroundColor: '#252527',
                                cursor: 'pointer', // Change cursor to pointer to indicate clickability
                                opacity: bountiesClicked ? 0.5 : 1

                            }}
                            onClick={devdockChatButtonClicked} // Add onClick handler
                        >
                            Devdock chat
                        </div>
                    </div>

                </div>
                <div style={{ height: 5 }}></div>
                {bountiesClicked ? <ExpandableCardList isUserLoggedIn={isUserLoggedIn} /> : <></>}
                <Chat onDevChatClick={devdockChatButtonClicked}
                    onBountiesClicked={handleBountiesClick}
                    isDashboardInView={bountiesClicked}
                />

                <Main onDevChatClick={devdockChatButtonClicked}
                    onBountiesClicked={handleBountiesClick}
                    isDashboardInView={bountiesClicked}
                ></Main>
                <div style={{ height: '125px' }}></div>
            </div >

        )
    }
};




export default Dashboard;


