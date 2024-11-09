import React, { useState, useEffect, useRef } from 'react';
import { VSCodeButton, VSCodePanelView } from '@vscode/webview-ui-toolkit/react';
import WhiteCrossSvg from './login/white_cross_svg';
import PopupCenterImg from './home/svgs/popup_center_svg';
import PopupCenterActionCompletionImg from './home/svgs/popup_center_action_complete_svg';

interface CommonPopupProps {
    isOpen: boolean;
    handleCloseClick: () => void;
    handleSubmit: (data?: string) => void;
    ctaText: string;
    heading?: string;
    description?: string;
    isReward?: boolean;
}

const CommonPopup: React.FC<CommonPopupProps> = ({ isOpen, handleCloseClick, handleSubmit, ctaText, heading, description, isReward }) => {


    return (
        <React.Fragment>
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 1000,
                    backdropFilter: 'blur(3px)',
                    padding: '20px', // Buffer padding to ensure the popup stays within the view
                    justifyItems: 'center'
                }}>
                    <div style={{ position: 'relative' }}>


                        <div style={
                            {
                                width: '350px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'end',
                                alignContent: 'flex-end',
                                backgroundColor: 'transparent',
                                // padding: '15px 5px 5px 15px',

                            }}>

                            <div onClick={handleCloseClick} style={
                                {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    width: '30px',
                                    backgroundColor: 'transparent',
                                    alignContent: "center",
                                    alignItems: 'center',
                                    marginRight: '5px',

                                }}>
                                <WhiteCrossSvg></WhiteCrossSvg>
                            </div>
                        </div>


                        <div style={{
                            padding: '20px',
                            backgroundColor: '#252527',
                            borderRadius: '16px',
                            width: '330px',
                            maxHeight: 'calc(100vh - 100px)', // Limit height to viewport with buffer space
                            overflowY: 'auto', // Enable scrolling when content exceeds max height
                        }}>

                            <div style={{ alignContent: 'center', alignItems: 'center', display: 'flex', flexDirection: 'column' }}>
                                {isReward ? <PopupCenterImg></PopupCenterImg> : <PopupCenterActionCompletionImg></PopupCenterActionCompletionImg>}

                            </div>
                            <div style={{ height: '20px' }}></div>
                            {heading ? <span style={{ color: '#ffffff', fontWeight: 'lighter', fontSize: '16px', alignContent: 'center', fontStyle: 'normal', }}>
                                {heading}</span> : ''}
                            <div style={{ height: '10px' }}></div>
                            {description ? <span style={{ opacity: '0.7', color: '#ffffff', fontWeight: 'lighter', fontSize: '12px', alignContent: 'center', fontStyle: 'normal', }}>
                                {description}</span> : ''}

                            <div style={{ height: '20px' }}></div>
                            {/* Submit Button */}
                            <div
                                onClick={() => handleSubmit()}
                                style={{
                                    display: 'flex', // Set the div to flex
                                    justifyContent: 'center', // Center content horizontally
                                    alignItems: 'center', // Center content vertically
                                    width: '258px',
                                    height: '30px',
                                    padding: '10px',
                                    background: 'linear-gradient(90deg, #3172FC 0%, #5738BE 100%)',
                                    borderRadius: '30px',
                                    cursor: 'pointer' // Optional: Add a pointer cursor on hover for button-like behavior
                                }}
                            >
                                <span style={{ color: 'white', fontWeight: 'bold' }}>{ctaText}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }
        </React.Fragment >
    );
};

export default CommonPopup;