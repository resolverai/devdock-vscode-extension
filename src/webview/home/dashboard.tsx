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
import { ClientMessage, ServerMessage } from '../../common/types';
import { EVENT_NAME, WEBUI_TABS } from '../../common/constants';
import { API_END_POINTS } from '../../services/apiEndPoints';
import apiService from '../../services/apiService';
import CommonPopup from '../common_popup';
import DevdockBountyPopup from '../devdock_bounty_popup';
import { useLoader } from '../Loader/Loader';

import RightArrowSVG from './svgs/arrow_svg';
import BackArrowSvG from './svgs/back_arrow_svg';
import MyBountiesTabView from './myBounties/myBountiesTabView';


const Dashboard: React.FC = () => {

    const [bountiesClicked, setBountiesClicked] = useState<boolean>(false);
    const [topTabsClicked, setTopTabClicked] = useState<boolean | null>(false);
    const [bountyClickedId, setBountyClickedId] = useState<number | null>(0);
    const [isUserLoggedIn, setUserLoggedin] = useState<boolean>(false);
    const [isGitHubPopupVisible, setGitHubPopupVisible] = useState(false);
    const [showLoggedInUserPopup, setLoggedInPoupVisibile] = useState(false);
    const [serverMessageForTab, setServerMessageForTab] = useState<string | undefined>();
    const [userLoggedInData, setUserLoginData] = useState<UserLoginData>();
    const [userId, setUserID] = useState<number>(0);
    const [showCommonPopup, setShowCommonPopup] = useState<boolean>(false);
    const [headingCommonPopup, setHeadingCommonPopup] = useState<string>('');
    const [descriptionCommonPopup, setDescriptionCommonPopup] = useState<string>('');
    const [isRewardCommonPopup, setRewardCommonPopup] = useState<boolean>(false);
    const [isDevdockBountyPopupOpen, setIsDevdockBountyPopupOpen] = useState(false);//make it false, true is for testing purpose
    const global = globalThis as any
    const { showLoader, hideLoader } = useLoader();
    const [hasBountiesUpdate, setHasBountiesUpdate] = useState(true);
    const [myBountiesClicked, setMyBountiesClicked] = useState(false);
    const [showMyBounties, setShowMyBounties] = useState(false);
    // const arrowPngUri = global.vscode.Uri.file(arrowPng).with({ scheme: 'vscode-resource' }).toString();



    type UserLoginData = {
        id: string,
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

    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const handleClosePopup = () => setIsPopupOpen(false);

    const handleSubmit = () => {
        setIsPopupOpen(false); // Close popup after submission

    };

    const handleOpenDevDockPopup = () => setIsDevdockBountyPopupOpen(true);

    useEffect(() => {
        console.log('useEffect showCommonPopup', showCommonPopup);
    }, [showCommonPopup]);

    useEffect(() => {
        console.log('useEffect hasBountiesUpdate', hasBountiesUpdate);
        console.log('Call an API to fetch bounties for approval');
    }, []);
    const handler = (event: MessageEvent) => {
        const message: ServerMessage<string | undefined> = event.data
        // console.log("Message received from server in dashboard.tsx: ", message?.type, message?.value?.data)
        if (message?.type === EVENT_NAME.devdockSetTab) {

            setServerMessageForTab(message?.value.data);

            if (message?.value.data == WEBUI_TABS.chat) {
                console.log("Top Tab clicked in dashboard.tsx inside WEBUI_TABS.chat, this is to show chat ui");
                setTopTabClicked(false);
                devdockChatButtonClicked();

            } else {
                setTopTabClicked(true);
                console.log("Top Tab clicked in dashboard.tsx inside WEBUI_TABS.chat, this is to show non chat ui");
            }
        }
        if (message?.type === EVENT_NAME.devdockStopGeneration) {
            console.log("devdockStopGeneration devdockStopGeneration");
            setTopTabClicked(false);
            devdockChatButtonClicked();
        }
        if (message?.type === EVENT_NAME.githubLoginDone) {
            console.log("githubLoginDone dashboard.tsx", message.value, typeof message.value);
            setUserLoggedin(true);
            const parsedMessageValue = message?.value as any;
            const balance = parsedMessageValue.data.balance;
            console.log('balance', balance);
            setUserLoginData(parsedMessageValue.data);
        }
        if (message?.type === EVENT_NAME.githubLogoutDone) {
            console.log("githubLogoutDone dashboard.tsx");
            setUserLoggedin(false);
        }

        if (message?.type === EVENT_NAME.showCommonPopup) {
            console.log('show poup for common popup for bounty');
            hideLoader();

            if (!message.value) {
                console.log("submitBountyRequest bounty id is undefined");
                return;
            }


            if (message.value !== undefined) {
                const myData = message.value.data as string;
                const data = JSON.parse(myData);
                console.log('EVENT_NAME.showCommonPopup dashboard', data);
                const type = data.type;
                if (type == 'bounty') {
                    const id = data?.id;
                    const hash = data?.hash;
                    setHeadingCommonPopup('Your submission has been completed');
                    setDescriptionCommonPopup('You will receive Devcash in your wallet, once your submission is approved');
                    setRewardCommonPopup(false);
                    setShowCommonPopup(true);
                    setIsPopupOpen(true);

                    console.log('show poup for common popup for bounty', hash, id);
                }
                else if (type == 'points') {

                    const description = data?.description;
                    const heading = data?.heading;

                    setDescriptionCommonPopup(description);
                    setHeadingCommonPopup(heading);
                    setRewardCommonPopup(true);
                    setShowCommonPopup(true);

                    setIsPopupOpen(true);
                }
                else if (type == 'bountyCreated') {

                    const heading = 'Your bounty has been posted successfully';
                    const description = 'We will notify you about responses ';
                    setDescriptionCommonPopup(description);
                    setHeadingCommonPopup(heading);
                    setRewardCommonPopup(false);
                    setShowCommonPopup(true);
                    setIsPopupOpen(true);
                }

            }

        }
        if (message?.type === EVENT_NAME.showBountyCreationPopUp) {
            console.log("showBountyCreationPopUp dashboard.tsx");
            setIsDevdockBountyPopupOpen(true);
        }
        return () => window.removeEventListener('message', handler)
    }

    useEffect(() => {
        window.addEventListener('message', handler)
    }, [])
    useEffect(() => {
        // console.log('topTabsClicked', topTabsClicked);
        console.log("Top Tab clicked in dashboard.tsx topTabsClicked", topTabsClicked);
    }, [topTabsClicked])

    const initiateBountyCreationFlow = (content: string) => {
        setIsDevdockBountyPopupOpen(false);

        console.log('bounty creation flow', content);
        //call backend to create a bounty for the content
        showLoader(`Creating your bounty, please wait ...`);
        const myData = { description: content }
        global.vscode.postMessage({
            type: EVENT_NAME.devdockBountyCreationRequest,
            data: JSON.stringify(myData),
        }) as ClientMessage;



    }

    const showPopupForUser = () => {
        if (isUserLoggedIn && showLoggedInUserPopup) {
            console.log('isUserLoggedIn', isUserLoggedIn, userLoggedInData);
            return (
                <UserGitHubLoggedInPopup onClose={closeUserGithubPopup} loginData={userLoggedInData} onLogout={() => {
                    console.log('handle user logout');

                    setUserLoginData(undefined);
                    setUserLoggedin(false);
                    localStorage.removeItem('userProfileInfo');
                    localStorage.removeItem('myBounties');
                    global.vscode.postMessage({
                        type: EVENT_NAME.githubLogoutDone,
                    })

                }}></UserGitHubLoggedInPopup>
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

    useEffect(() => {

        // localStorage.setItem('userProfileInfo', '');
        const myUserData = localStorage.getItem('userProfileInfo');
        // console.log('myUserData in dashboard.tsx', typeof myUserData);
        let userId;
        if (myUserData && myUserData != null) {
            userId = JSON.parse(myUserData).id;
            console.log('myUserData in dashboard.tsx userId', userId);
        }

        if (userId)
            fetchUserInfo(
                userId,//user id
                (response: UserLoginData) => {
                    console.log("OnSuccess response", response);
                    setUserLoggedin(true);
                    const parsedMessageValue = response;
                    const balance = parsedMessageValue.balance;
                    console.log('parsedMessageValue balance', balance);
                    setUserLoginData(parsedMessageValue);
                    // setUserID(id);
                    localStorage.setItem('userProfileInfo', JSON.stringify(response));


                    // context.globalState.update("userProfileInfo", responseVal);
                    // console.log('user_id', id);
                },
                () => {
                    console.log("OnFailure");
                }
            );
    }, []);

    useEffect(() => {
        console.log('userLoggedInData', userLoggedInData);
        // userLoginData = userLoggedInData;
        setUserLoginData(userLoggedInData);
        if (userLoggedInData != undefined && userLoggedInData != null) {
            setUserLoggedin(true);

            //TODO save userLoggedInData in localstorage when its type is UserLoginData
            localStorage.setItem('userProfileInfo', JSON.stringify(userLoggedInData));
        }

        else {
            setUserLoggedin(false);
        }



    }, [userLoggedInData]);

    const fetchUserInfo = (
        userId: number,
        onSuccess: (response: any) => void,
        onFailure: () => void
    ) => {
        console.log("fetchUserInfo called");

        // fetchUserInfo(
        //   13,//user id
        //   () => {
        //     console.log("OnSuccess");
        //   },
        //   () => {
        //     console.log("OnFailure");
        //   }
        // );

        apiService.get(API_END_POINTS.FETCH_USER + userId).then((response: any) => {
            const {
                id,
            } = response.data;
            if (id) {
                setUserID(id);
                onSuccess(response.data);

            } else {
                onFailure();
            }
        });
    };

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
    const handleConversationTab = (newTabVal: string) => {
        console.log('handleConversationTab clicked!');

        setServerMessageForTab(newTabVal);
        devdockChatButtonClicked();
        setTopTabClicked(false);

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
        function getProfileHeader() {
            return (
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
            );
        }

        function getTopTabs() {
            return (
                !topTabsClicked && <div>
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
            );
        }

        const myBountiesTabClicked = () => {
            console.log('Go to my bounties');
            setMyBountiesClicked(true);
            setShowMyBounties(true);

        }
        const handleBackBountiesClick = () => {
            console.log('Back button clicked');
            setMyBountiesClicked(false);
            setShowMyBounties(false);

        }


        function myBountiesView() {
            return (
                bountiesClicked &&
                <div
                    style={{
                        height: '30px',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        backgroundColor: '#292929',
                        alignContent: 'center',
                        marginTop: '10px',
                        marginBottom: '5px',

                    }}
                >

                    <div style={{ float: 'left', display: 'flex', flexDirection: 'row', cursor: 'pointer' }}>
                        {bountiesClicked && myBountiesClicked ? <div onClick={handleBackBountiesClick} style={{ alignContent: 'center', alignItems: 'center', textAlign: 'center', marginRight: '10px' }}>
                            <BackArrowSvG></BackArrowSvG>
                        </div> : null}

                        <div onClick={myBountiesTabClicked} style={{ alignContent: 'center', alignItems: 'center', textAlign: 'center', marginRight: '80px', cursor: 'pointer' }}>
                            <span style={{ textAlign: 'center' }}>My Bounties</span>
                        </div>

                    </div>



                    <div onClick={myBountiesTabClicked} style={{ float: 'right', display: 'flex', flexDirection: 'row', cursor: 'pointer' }}>
                        <div style={{ background: 'green', borderRadius: '16px', height: '20px', width: '20px', marginRight: '20px', alignContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                            <span style={{ color: 'black', fontSize: '10px' }}>2</span>
                        </div>
                        <div style={{ alignContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                            <RightArrowSVG></RightArrowSVG>
                        </div>



                    </div>
                </div>
            );
        }

        function getBountiesListView() {
            return (
                !topTabsClicked && bountiesClicked ? <ExpandableCardList isUserLoggedIn={isUserLoggedIn} onBountiesClickedFromList={handleBountyClickId} /> : null

            );
        }

        function showMyBountiesView(): boolean {
            const showMyBounties = bountiesClicked && hasBountiesUpdate && myBountiesClicked;
            return showMyBounties;
        }



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
                {getProfileHeader()}
                <div style={{ height: 10, width: '100%' }}></div>
                <div style={{ height: 1, width: '100%', backgroundColor: "#212121" }}></div>
                <div style={{ height: 10, width: '100%' }}></div>

                {!showMyBountiesView() && getTopTabs()}
                <div style={{ height: 5 }}></div>
                {hasBountiesUpdate ? myBountiesView() : null}
                {showMyBountiesView() ? <MyBountiesTabView></MyBountiesTabView> : null}

                <div style={{ height: 5 }}></div>
                {!showMyBountiesView() && getBountiesListView()}



                {!showMyBountiesView() && topTabsClicked ? <Main
                    tabServerMessageValue={serverMessageForTab}
                    onTabChange={handleConversationTab}

                ></Main> :
                    !showMyBountiesView() && <Chat
                        isUserLoggedIn={isUserLoggedIn}
                        topTabClickedProp={topTabsClicked}
                        onDevChatClick={devdockChatButtonClicked}
                        onBountiesClicked={bountyClickedId}
                        isDashboardInView={bountiesClicked}
                    />}

                {showCommonPopup && <CommonPopup isReward={isRewardCommonPopup} handleSubmit={handleSubmit} isOpen={isPopupOpen} handleCloseClick={handleClosePopup} ctaText='ok' description={descriptionCommonPopup} heading={headingCommonPopup} ></CommonPopup>}
                {/* {<CommonPopup isReward={false} handleSubmit={() => { }} isOpen={true} handleCloseClick={() => { }} ctaText='ok' description='You will receive Devcash in your wallet, once your submission is approved' heading='Your submission has been completed' centered={true}></CommonPopup>} */}

                {isDevdockBountyPopupOpen && <DevdockBountyPopup isDevdockBountyPopupOpen={isDevdockBountyPopupOpen} handleCloseClick={() => {
                    setIsDevdockBountyPopupOpen(false);

                }} handleSubmit={(content) => {

                    initiateBountyCreationFlow(content);
                }} />}

                <div style={{ height: '125px' }}></div>

            </div >

        )
    }
};




export default Dashboard;


