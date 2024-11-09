// src/webview/App.tsx
import React, { useState, useEffect } from 'react';
import Dashboard from './home/dashboard';
import Loader from './components/Loader';

const App: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("Loading...");

    useEffect(() => {
        // Listen for messages from the VS Code extension to show/hide the loader
        window.addEventListener('message', (event) => {
            const { command, message } = event.data;
            if (command === 'showLoader') {
                setMessage(message || "Loading...");
                setLoading(true);
            } else if (command === 'hideLoader') {
                setLoading(false);
            }
        });
    }, []);

    return (
        <div>
            {loading && <Loader message={message} />}
            <Dashboard />
        </div>
    );
};

export default App;
