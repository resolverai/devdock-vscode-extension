import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import React, { useState } from 'react';

interface CopyButtonProps {
    textToCopy: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ textToCopy }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        try {
            console.log('copyClipboard clicked', textToCopy, navigator);
            navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 1000); // Reset after 2 seconds
        } catch (error) {
            console.error("Failed to copy: ", error);
        }
    };

    return (
        <div style={{ height: '10px', width: '20px', cursor: "pointer" }}
            onClick={handleCopy}>

            <span style={{ fontSize: '20px', color: 'white', opacity: 0.4, }}>{`⧉`}</span>

            {copied && <span style={{ marginLeft: '10px', color: 'green' }}>Copied!</span>}
        </div >
    );
};

export default CopyButton;
