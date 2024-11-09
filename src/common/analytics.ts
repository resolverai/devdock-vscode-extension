// src/Analytics.ts
import mixpanel, { Mixpanel } from "mixpanel-browser";
import { AnalyticsEvents } from "./analyticsEventKeys";
import axios, { AxiosRequestConfig } from "axios";

import * as vscode from "vscode";

class Analytics {
  private static instance: Analytics;
  private isInitialized = false;
  private postViaApi = false;
  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  // Singleton pattern to ensure only one instance
  public static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  // Initialize Mixpanel with token from environment variables

  public init(isApiEnable?: boolean): void {
    if (isApiEnable) {
      this.postViaApi = true;
    } else {
      const mixpanelToken = process.env.MIXPANEL_TOKEN;

      if (!mixpanelToken) {
        console.error(
          "Mixpanel token is missing! Please check your .env file."
        );
        return;
      }

      mixpanel.init(mixpanelToken, {
        debug: true, // Optional: Enable debug mode to see Mixpanel logs
        ignore_dnt: false,
        persistence: "cookie",
        loaded: (mixp) => {
          mixp.track(AnalyticsEvents.Activated);
          mixp.identify("42ouf");
        },
      });

      this.isInitialized = true;
    }
  }

  // Track events with optional data
  public trackEvent(
    eventName: string,
    data?: Record<string, any> | boolean
  ): void {
    if (data) {
      if (typeof data === "boolean") {
        const myData = { value: data };
        this.postEvent(eventName, myData);
      } else {
        this.postEvent(eventName, data);
        if (eventName == AnalyticsEvents.CPisRAGContextClickedEnabled) {
          if (data.isEnabled) {
            vscode.window.showInformationMessage(
              "Workspace has been added in the chat context",
              {
                modal: false,
              }
            );
          } else {
            vscode.window.showInformationMessage(
              "Workspace has been removed from the chat context",
              {
                modal: false,
              }
            );
          }
        }
      }
    } else {
      this.postEvent(eventName);
    }
  }
  private postEvent(eventName: string, data?: Record<string, any>): void {
    // If API posting is enabled
    if (this.postViaApi) {
      console.log(
        "API enabled for posting event:",
        eventName,
        data ? data : ""
      );

      try {
        const axiosData = [
          {
            properties: {
              token: process.env.MIXPANEL_TOKEN, // Replace with your Mixpanel project token
              data: data,
            },
            event: eventName,
          },
        ];

        this.postEventViaApi(axiosData);
      } catch (error) {
        console.error("Error while posting event to API:", error);
      }
    } else {
      // Mixpanel tracking block (when API posting is disabled)
      if (!this.isInitialized) {
        console.warn("Analytics is not initialized. Call init() first.");
        return;
      }

      console.log("Mixpanel event to post:", eventName, data);

      if (typeof mixpanel === "undefined") {
        console.error("Mixpanel failed to load");
      } else {
        // Track event with Mixpanel
        if (data) {
          if (typeof data === "boolean") {
            const myData = { value: data };
            mixpanel.track(eventName, myData);
          } else {
            mixpanel.track(eventName, data);
          }
        } else {
          // Track event without data
          mixpanel.track(eventName);
        }
      }
    }
  }

  private postEventViaApi(data: object) {
    // Define the axios request configuration
    const options: AxiosRequestConfig = {
      method: "POST",
      url: "https://api.mixpanel.com/track",
      headers: {
        Accept: "text/plain",
        "Content-Type": "application/json",
      },
      data: JSON.stringify(data), // Convert the data to a JSON string
    };
    axios(options)
      .then((response) => {
        console.log("Response:", response.data); // Handle the successful response
      })
      .catch((error) => {
        console.error("Error:", error); // Handle any errors
      });
  }
}

export default Analytics.getInstance();
