// src/webview/EventSender.tsx
import React from 'react';
import {
    WORKSPACE_STORAGE_KEY,
    EVENT_NAME,
 
  } from '../common/constants'
// Define the ClientMessage interface for consistency
interface ClientMessage {
    type: string;
    key: string;
    data?: Record<string, any>;
}

class EventSender {
    // Method to send events from the webview to the extension context
    public static sendEvent(eventName: string, data?: Record<string, any>): void {
        const global = globalThis as any


        const message: ClientMessage = {
            type: EVENT_NAME.devdockAnalyticsEvent,
            key: eventName,
            data: data,
        };

        global.vscode.postMessage(message); // Send message to the extension
        console.log(`Event sent: ${eventName}`, data ? `with data: ${JSON.stringify(data)}` : '');
    }
}

export default EventSender;
