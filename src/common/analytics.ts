// src/Analytics.ts
import mixpanel, { Mixpanel } from "mixpanel-browser";
import { AnalyticsEvents } from "./analyticsEventKeys";
import axios, { AxiosRequestConfig } from "axios";

import * as vscode from "vscode";
import { getContext } from "../extension/context";
import * as path from "path";
import * as fs from "fs";
import { on } from "events";

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

  private postEventViaApi(axiosData: any) {
    // const axiosData = [
    //   {
    //     properties: {
    //       token: process.env.MIXPANEL_TOKEN, // Replace with your Mixpanel project token
    //       data: data,
    //     },
    //     event: eventName,
    //   },
    // ];
    //get location before calling events api
    this.getLocationFromIP((successCallbackResponse) => {
      console.log("successCallbackResponse", successCallbackResponse);
      const { city, country } = successCallbackResponse;
      console.log("successCallbackResponse city, country", city, country);
      const userProfileInfo = getContext()?.globalState.get("userProfileInfo");
      const userID = JSON.parse(userProfileInfo as string)?.id;
      const githubId = JSON.parse(userProfileInfo as string)?.github_id;
      const commonData = {
        version: this.getExtensionVersion(), // Default version number
        deviceType: "extension", // Default device type
        city: city, // Default location
        country: country, // Default location
        userId: userID ? userID : "",
        githubId: githubId ? githubId : "",
      };

      let data = axiosData[0]?.properties?.data;
      if (data != undefined) {
        data = { ...commonData, ...data };
      } else {
        data = { ...commonData };
      }
      // Merge commonData with the incoming data
      // data = { ...commonData, ...data };

      const axiosDataVal = [
        {
          properties: {
            token: process.env.MIXPANEL_TOKEN, // Replace with your Mixpanel project token
            data: data,
          },
          event: axiosData[0].event,
        },
      ];
      const options: AxiosRequestConfig = {
        method: "POST",
        url: "https://api.mixpanel.com/track",
        headers: {
          Accept: "text/plain",
          "Content-Type": "application/json",
        },
        data: axiosDataVal, // Convert the data to a JSON string
      };
      axios(options)
        .then((response) => {
          console.log("postEventViaApi Response:", response);
        })
        .catch((error) => {
          console.error("Error:", error); // Handle any errors
        });
    });
  }
  private getExtensionVersion(): string {
    try {
      // Get the path to the extension's `package.json`
      const packagePath = path.join(__dirname, "..", "package.json");

      // Read and parse `package.json`
      const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));

      // Return the version field
      return packageJson.version;
    } catch (error) {
      console.error("Failed to read extension version:", error);
      return "unknown";
    }
  }

  private getLocationFromIP(onSuccess: (response: any) => void) {
    try {
      // Step 1: Use ip-api to get location data directly (no need to fetch IP separately)
      // const locationResponse = await
      axios.get("http://ip-api.com/json/").then((locationResponse) => {
        const locationData = locationResponse.data;

        // Step 2: Parse and return location data
        const resultVal = {
          city: locationData.city,
          country: locationData.country,
        };
        onSuccess(resultVal);
      });

      // return resultVal;
    } catch (error: any) {
      console.error(`Failed to fetch location: ${error.message}`);
      // return { city: "", country: "" };
    }
  }
}

export default Analytics.getInstance();
