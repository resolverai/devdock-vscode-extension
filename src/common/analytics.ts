// src/Analytics.ts
import mixpanel from "mixpanel-browser";

class Analytics {
  private static instance: Analytics;
  private isInitialized = false;

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
  public init(): void {
    const mixpanelToken = process.env.MIXPANEL_TOKEN;

    if (!mixpanelToken) {
      console.error("Mixpanel token is missing! Please check your .env file.");
      return;
    }

    mixpanel.init(mixpanelToken, {
      debug: true, // Optional: Enable debug mode to see Mixpanel logs
    });

    this.isInitialized = true;
    console.log("Mixpanel initialized successfully.");
  }

  // Track events with optional data
  public trackEvent(
    eventName: string,
    data?: Record<string, any> | boolean
  ): void {
    if (!this.isInitialized) {
      console.warn("Analytics is not initialized. Call init() first.");
      return;
    }

    if (data) {
      if (typeof data === "boolean") {
        mixpanel.track(eventName, { value: data });
        console.log(`Event tracked: ${eventName} with value: ${data}`);
      } else {
        mixpanel.track(eventName, data);
      }
    } else {
      //event without any data
      mixpanel.track(eventName);
    }

    console.log(
      `Mixpanel Event tracked: ${eventName}`,
      data ? `with data: ${JSON.stringify(data)}` : ""
    );
  }
}

export default Analytics.getInstance();
