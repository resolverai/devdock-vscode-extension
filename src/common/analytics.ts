// src/Analytics.ts
import mixpanel, { Mixpanel } from "mixpanel-browser";
import { AnalyticsEvents } from "./analyticsEventKeys";
import apiService, { eventsTrackingEndPont } from "../services/apiService";

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
      }
    } else {
      this.postEvent(eventName);
    }
  }
  private postEvent(eventName: string, data?: Record<string, any>): void {
    if (this.postViaApi) {
      //api enabled
      //hit post api to post Event
      console.log("api enabled for post event", eventName, data);
      let myApiPostData = { name: eventName, data: {} };
      if (data) {
        if (typeof data === "boolean") {
          const tempData = { value: data };
          myApiPostData.data = tempData.value;
        } else {
          myApiPostData.data = data;
        }
      }

      try {
        apiService
          .post(eventsTrackingEndPont, myApiPostData)
          .then((response) => {
            console.log("POST Response:", response);
          });
      } catch (error) {
        console.error("Failed to post data for event tracking:", error);
      }
    } else {
      if (!this.isInitialized) {
        console.warn("Analytics is not initialized. Call init() first.");
        return;
      }
      console.log("MixPanel even to post", eventName, data);
      if (typeof mixpanel === "undefined") {
        console.error("Mixpanel failed to load");
      } else {
        if (data) {
          if (typeof data === "boolean") {
            const myData = { value: data };
            mixpanel.track(eventName, myData);
            // console.log(`Event tracked: ${eventName} with value: ${data}`);
          } else {
            mixpanel.track(eventName, data);
          }
        } else {
          //event without any data
          mixpanel.track(eventName);
        }
      }
    }
  }
}

export default Analytics.getInstance();
