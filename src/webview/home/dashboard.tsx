import React from 'react'
import { Main } from '../main'
import './container.css'
import ExpandableCardList from '../expandableCardList';
import PlugSVG from './svgs/plug_btn_svg';
import ChatHistorySVG from './svgs/chat_history_svg';
import HamberIcon from './svgs/hanberger_icon';
import DevDockLogoSVG from './svgs/devdock_logo';
import ProfileIcon from './svgs/profile_icon';


const Dashboard: React.FC = () => {
    const plugImage = getImagePath('plug_btn.svg');
    {
        return (

            <div className="scrollable-container">
                <div className="vertical-item">
                    <div style={{ height: 10 }}></div>
                    <div className="horizontal-container-equal-spacing">
                        <div className="nested-item">DEVDOCK</div>
                        <div style={{ height: 10 }}></div>
                        <div className="horizontal-container-equal-spacing">
                            <div style={{ cursor: 'pointer', }} >
                                <ChatHistorySVG />
                            </div>

                            <div style={{ cursor: 'pointer', }} >
                                <PlugSVG />
                            </div>


                        </div>
                    </div>

                    <div style={{ height: 20, width: '100%' }}></div>
                    <div className="horizontal-container">
                        <div style={{ cursor: 'pointer', }} >
                            <HamberIcon />
                        </div>
                        <DevDockLogoSVG />
                        <div style={{ cursor: 'pointer', }}>
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
                                    cursor: 'pointer' // Change cursor to pointer to indicate clickability
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
                                    cursor: 'pointer' // Change cursor to pointer to indicate clickability
                                }}
                                onClick={devdockChatButtonClicked} // Add onClick handler
                            >
                                Devdock chat
                            </div>
                        </div>

                    </div>
                    <div style={{ height: 10 }}></div>
                    <ExpandableCardList />
                    <Main />
                </div >
            </div >

        )
    }
};

const handleBountiesClick = () => {
    // Handle the click event here
    console.log("Bounties clicked!");
};

const devdockChatButtonClicked = () => {
    // Handle the click event here
    console.log("Devdock chat clicked!");
};


// Function to get the image path dynamically
const getImagePath = (imageName: string) => {
    // Use VS Code extension's API to get the image path from the extension directory
    return `/../../../assets/${imageName}`; // Relative path to the 'media' folder
};

export default Dashboard;
