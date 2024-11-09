// src/webview/components/Loader.tsx
import React from 'react';

type LoaderProps = {
    message?: string;
};

const Loader: React.FC<LoaderProps> = ({ message = "Loading..." }) => {

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            zIndex: 1000,
        }}>
            <div className="spinner" style={{ marginBottom: '10px' }}>
                {/* Custom CSS or spinner animation can go here */}
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #ccc',
                    borderTop: '4px solid #333',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                }} />
            </div>
            <p>{message}</p>
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div>
    );
};

export default Loader;
