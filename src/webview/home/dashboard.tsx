import React, { useState } from 'react'
import './container.css'
import ExpandableCardList from '../expandableCardList';
import PlugSVG from './svgs/plug_btn_svg';
import ChatHistorySVG from './svgs/chat_history_svg';
import HamberIcon from './svgs/hanberger_icon';
import DevDockLogoSVG from './svgs/devdock_logo';
import ProfileIcon from './svgs/profile_icon';
import { Main } from '../main';
import { Chat } from '../chat';
import MyTestButton from '../test/test_button';


const Dashboard: React.FC = () => {

    const [bountiesClicked, setBountiesClicked] = useState<boolean>(true);

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
                    
                    <MyTestButton/>

                <div style={{ height: 10, width: '100%' }}></div>
                <div className="horizontal-container">


                    <div style={{ height: '18px' }}>
                        <HamberIcon />
                    </div>
                    <div style={{ height: '18px' }}>
                        <DevDockLogoSVG />
                    </div>
                    <div style={{ height: '18px' }}>
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
                {bountiesClicked ? <ExpandableCardList isUserLoggedIn={false} /> : <></>}
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
