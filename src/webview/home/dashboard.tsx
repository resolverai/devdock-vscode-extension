import React, { useEffect, useState } from 'react'
import './container.css'
import ExpandableCardList from '../expandableCardList';
import HamberIcon from './svgs/hanberger_icon';
import DevDockLogoSVG from './svgs/devdock_logo';
import ProfileIcon from './svgs/profile_icon';
import { Main } from '../main';
import { Chat } from '../chat';
import GitHubLoginPopup from '../login/github_login_popup';
import UserGitHubLoggedInPopup from '../user/github_user_loggedin_popup';
import { ServerMessage } from '../../common/types';
import { EVENT_NAME, WEBUI_TABS } from '../../common/constants';


const Dashboard: React.FC = () => {

    const [bountiesClicked, setBountiesClicked] = useState<boolean>(true);
    const [topTabsClicked, setTopTabClicked] = useState<boolean | null>(false);
    const [bountyClickedId, setBountyClickedId] = useState<number | null>(0);
    const [isUserLoggedIn, setUserLoggedin] = useState<boolean>(true);
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


    const handler = (event: MessageEvent) => {
        const message: ServerMessage<string | undefined> = event.data
        // console.log("Message received from server: ", message)
        if (message?.type === EVENT_NAME.devdockSetTab) {

            setTopTabClicked(true);
            console.log("Top Tab clicked in dashboard.tsx topTabsClicked", topTabsClicked);
            if (message?.value.data == WEBUI_TABS.chat) {
                console.log("Top Tab clicked in dashboard.tsx inside WEBUI_TABS.chat, this is to show chat ui");
                setTopTabClicked(false);
            }
        }
        return () => window.removeEventListener('message', handler)
    }
    useEffect(() => {
        window.addEventListener('message', handler)
    }, [])
    useEffect(() => {
        console.log('topTabsClicked', topTabsClicked);
    }, [topTabsClicked])



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
        // setTopTabClicked(false);

    };

    const handleBountyClickId = (id: number) => {
        console.log('Bounty clicked! id:', id);
        // Set both bounties and devdockChat opacity to 0.5 when bounties is clicked
        setBountiesClicked(true);
        // setTopTabClicked(false);

        if (bountyClickedId == id) {
            setBountyClickedId(null); // Temporarily set it to null
            setTimeout(() => {
                setBountyClickedId(id); // Reset it back to the clicked ID after a short delay
            }, 0);

        } else {
            setBountyClickedId(id);
        }


    };

    const devdockChatButtonClicked = () => {
        console.log('Devdock chat clicked!');
        // Set both bounties and devdockChat opacity to 0.5 when devdockChat is clicked
        setBountiesClicked(false);
        // setTopTabClicked(false);
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

                {!topTabsClicked && <div>
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

                </div>}

                <div style={{ height: 5 }}></div>
                {!topTabsClicked && bountiesClicked ? <ExpandableCardList isUserLoggedIn={isUserLoggedIn} onBountiesClickedFromList={handleBountyClickId} /> : null}


                {topTabsClicked ? <Main
                    onDevChatClick={devdockChatButtonClicked}
                ></Main> : <Chat
                    topTabClickedProp={topTabsClicked}
                    onDevChatClick={devdockChatButtonClicked}
                    onBountiesClicked={bountyClickedId}
                    isDashboardInView={bountiesClicked}
                />}


                <div style={{ height: '125px' }}></div>
            </div >

        )
    }
};




export default Dashboard;


