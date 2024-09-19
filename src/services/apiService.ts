import axios, { AxiosInstance, AxiosResponse } from "axios";

class ApiService {
  private apiClient: AxiosInstance;

  constructor(baseURL: string) {
    this.apiClient = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
        // You can add Authorization headers or other common headers here if needed
      },
    });
  }

  // GET request
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.apiClient.get(endpoint, {
        params,
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // POST request
  async post<T>(endpoint: string, data: Record<string, any>): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.apiClient.post(
        endpoint,
        data
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // PUT request
  async put<T>(endpoint: string, data: Record<string, any>): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.apiClient.put(
        endpoint,
        data
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // Error handling method
  private handleError(error: any): void {
    console.error("API call failed:", error);
    // Optionally, handle specific error types (e.g., 400, 500, etc.)
  }
}

// Example usage:
const BASE_URL = "https://api.devdock.ai";
export const eventsTrackingEndPont = "/trackEvents";
const apiService = new ApiService(BASE_URL);

export default apiService;

//trackEvents post data
//POST https://api.devdock.ai/trackEvents
//{"eventName":"someValue", "data":"someData"}
