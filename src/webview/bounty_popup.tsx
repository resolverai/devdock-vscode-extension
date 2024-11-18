import React, { useState, useEffect, useRef } from 'react';
import { VSCodeButton, VSCodePanelView } from '@vscode/webview-ui-toolkit/react';
import WhiteCrossSvg from './login/white_cross_svg';

interface BountyPopupProps {
    isOpen: boolean;
    handleCloseClick: () => void;
    handleSubmit: (id: string, text: string) => void;
    bountyId: string;
}

const BountyPopup: React.FC<BountyPopupProps> = ({ isOpen, handleCloseClick, handleSubmit, bountyId }) => {
    const [content, setContent] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [errorMessage, setErrorMessage] = useState(''); // State to manage error message

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
    };

    // Auto-expand the height of the textarea based on content
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '100px'; // Reset to minimum height
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Adjust height based on content
        }
    }, [content]);

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
                                width: '360px',
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
                                    marginRight: '25px',

                                }}>
                                <WhiteCrossSvg></WhiteCrossSvg>
                            </div>
                        </div>


                        <div style={{
                            padding: '20px',
                            backgroundColor: '#252527',
                            borderRadius: '16px',
                            width: '280px',

                            maxHeight: 'calc(100vh - 100px)', // Limit height to viewport with buffer space
                            overflowY: 'auto', // Enable scrolling when content exceeds max height
                            alignContent: 'center',
                            alignItems: 'center'
                        }}>
                            <span style={{ color: '#ffffff', lineHeight: '15px', fontWeight: 'bold', fontSize: '16px', alignContent: 'center', fontStyle: 'normal', }}>
                                Submit entry</span>
                            <div style={{ height: '1px' }}></div>
                            <span style={{ opacity: '0.7', color: '#ffffff', lineHeight: '15px', fontWeight: 'lighter', fontSize: '12px', alignContent: 'center', fontStyle: 'normal', }}>
                                Enter details about your submission</span>
                            <div style={{ height: '10px' }}></div>
                            <div style={{

                                border: '1px solid', // Black border with 50% opacity
                                borderColor: '#4B4B54',
                                borderRadius: '15px', // Rounded corners
                                padding: '10px',
                                boxSizing: 'border-box',

                            }}>
                                <div>
                                    <span style={{ opacity: '0.8', color: '#ffffff', lineHeight: '15px', fontWeight: 'lighter', fontSize: '12px', alignContent: 'center', fontStyle: 'normal', }}>
                                        Bounty id</span>
                                </div>
                                <div style={{ height: '1px' }}></div>
                                <div>
                                    <span style={{ opacity: '0.5', color: '#ffffff', lineHeight: '15px', fontWeight: 'lighter', fontSize: '12px', alignContent: 'center', fontStyle: 'normal', }}>
                                        {bountyId}</span>
                                </div>
                            </div>
                            <div style={{ height: '10px' }}></div>
                            {/* Textarea Input */}
                            <div style={{ position: 'relative', width: '100%' }}>
                                {/* Label associated with the textarea */}
                                <label
                                    htmlFor="descriptionTextarea"
                                    style={{
                                        position: 'absolute',
                                        top: '8px',
                                        left: '10px',
                                        fontSize: '10px',
                                        color: '#969696', // Light color for hint text
                                        backgroundColor: '#1F1F22', // Match the background color of textarea
                                        padding: '0 5px',
                                        zIndex: 1
                                    }}
                                >
                                    Submission
                                </label>

                                {/* Textarea input */}
                                <textarea
                                    id="descriptionTextarea"
                                    ref={textareaRef}
                                    value={content}
                                    onChange={handleContentChange}
                                    style={{
                                        width: '100%',
                                        minHeight: '100px',
                                        maxHeight: '300px', // Set maximum height for the textarea
                                        resize: 'none',
                                        overflowY: 'auto', // Enable scrolling within textarea
                                        paddingTop: '20px',
                                        paddingRight: '10dp',
                                        boxSizing: 'border-box',
                                        fontSize: '12px',
                                        marginBottom: '20px',
                                        backgroundColor: '#1F1F22',
                                        color: '#fff', // Text color inside textarea
                                        scrollbarWidth: 'none', // Firefox
                                        msOverflowStyle: 'none', // Internet Explorer and Edge
                                        borderRadius: '8px', // Optional rounded corners
                                        border: '1px solid rgba(255, 255, 255, 0.2)' // Optional border with opacity
                                    }}
                                    rows={1}
                                />
                            </div>
                            {/* Style for WebKit browsers to hide scrollbar */}
                            <style>
                                {`
                                    textarea::-webkit-scrollbar {
                                        display: none;
                                    }
                                `}
                            </style>

                            {errorMessage && (
                                <div
                                    style={{
                                        color: 'red',
                                        fontSize: '12px',
                                        marginBottom: '5px',

                                        textAlign: 'center',
                                        opacity: 0.7
                                    }}
                                >
                                    {errorMessage}
                                </div>
                            )}
                            {/* Submit Button */}
                            <div
                                onClick={() => {
                                    if (content.trim().length > 0) {
                                        setErrorMessage(''); // Set error message empty to hide
                                        handleSubmit(bountyId, content)
                                    }

                                    else {
                                        //content is empty
                                        setErrorMessage('Please provide details of source code like Github links'); // Set error message empty to hide
                                    }
                                }

                                }
                                style={{
                                    display: 'flex', // Set the div to flex
                                    justifyContent: 'center', // Center content horizontally
                                    alignItems: 'center', // Center content vertically
                                    width: '258px',
                                    height: '35px',
                                    padding: '10px',
                                    background: 'linear-gradient(90deg, #3172FC 0%, #5738BE 100%)',
                                    borderRadius: '30px',
                                    cursor: 'pointer' // Optional: Add a pointer cursor on hover for button-like behavior
                                }}
                            >
                                <span style={{ color: 'white', fontWeight: 'bold' }}>Submit</span>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }
        </React.Fragment >
    );
};

export default BountyPopup;
