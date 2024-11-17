import React, { createContext, useContext, useState } from 'react';

// Create a context for managing the loader state
const LoaderContext = createContext<{
    showLoader: (text?: string) => void;
    hideLoader: () => void;
}>({
    showLoader: () => { },
    hideLoader: () => { },
});

// Loader Provider
export const LoaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [loaderText, setLoaderText] = useState('Please wait...');

    const showLoader = (text?: string) => {
        setLoaderText(text || 'Please wait...');
        setIsVisible(true);
    };

    const hideLoader = () => {
        setIsVisible(false);
    };

    return (
        <LoaderContext.Provider value={{ showLoader, hideLoader }}>
            {children}
            {isVisible && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(5px)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 9999,

                    }}
                >
                    <div
                        style={{
                            textAlign: 'center',
                            color: '#ffffff',
                            fontSize: '16px',
                        }}
                    >
                        <div
                            style={{
                                marginBottom: '16px',
                                justifyContent: 'center',
                                display: 'flex',
                            }}
                        >
                            {/* Spinner */}
                            <div
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    border: '4px solid rgba(255, 255, 255, 0.3)',
                                    borderTop: '4px solid #ffffff',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite',
                                    alignSelf: 'center',
                                    alignContent: 'center',
                                    alignItems: 'center'
                                }}
                            ></div>
                        </div>
                        {loaderText}
                    </div>
                </div>
            )}
        </LoaderContext.Provider>
    );
};

// CSS for Spinner Animation
const spinnerStyles = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

// Inject the styles into the DOM
const styleSheet = document.createElement('style');
styleSheet.type = 'text/css';
styleSheet.innerText = spinnerStyles;
document.head.appendChild(styleSheet);

// Hook to use loader context
export const useLoader = () => useContext(LoaderContext);
