import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

class ApiService {
  private apiClient: AxiosInstance;

  constructor(baseURL: string) {
    this.apiClient = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Adding interceptors to log requests and responses for both apiClient and analyticsClient
    this.addInterceptors(this.apiClient);
  }
  // Function to add interceptors
  private addInterceptors(client: AxiosInstance) {
    client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        console.log("Request Sent: ", config);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log("Response Received: ", response);
        return response;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.apiClient.get(endpoint, {
        params,
      });
      if (response.status === 200) {
        // Success response, return JSON parsed string
        return response.data;
      } else {
        // Failure response, create a failure response
        throw this.createFailureResponse(response);
      }
    } catch (error) {
      this.handleError(error, endpoint);
      throw error;
    }
  }

  // POST request for general APIs
  async post<T>(endpoint: string, data: Record<string, any>): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.apiClient.post(
        endpoint,
        data
      );
      if (response.status === 200 || response.status === 201) {
        // Success response, return JSON parsed string
        return response.data;
      } else {
        // Failure response, create a failure response
        throw this.createFailureResponse(response);
      }
    } catch (error) {
      this.handleError(error, endpoint);
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
      if (response.status === 200) {
        // Success response, return JSON parsed string
        return response.data;
      } else {
        // Failure response, create a failure response
        throw this.createFailureResponse(response);
      }
    } catch (error) {
      this.handleError(error, endpoint);
      throw error;
    }
  }

  // Helper method to create a failure response
  private createFailureResponse(response: AxiosResponse) {
    console.log("createFailureResponse", response);
    return {
      success: false,
      status: response.status,
      message: response.statusText,
      data: response.data,
    };
  }

  // NEW: Dynamic request method to support full URLs
  async postWithFullUrl<T>(
    url: string,
    data: Record<string, any>,
    key?: string
  ): Promise<T> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (key) {
        headers.Authorization = `Bearer ${key}`;
      }

      const response: AxiosResponse<T> = await axios.post(url, data, {
        headers,
      });
      return response.data;
    } catch (error) {
      this.handleError(error, url);
      throw error;
    }
  }

  async getWithFullUrl<T>(
    url: string,
    params: Record<string, any> = {},
    key?: string
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (key) {
      headers.Authorization = `Bearer ${key}`;
    }
    try {
      const response: AxiosResponse<T> = await axios.get(url, {
        headers,
        params, // Query parameters if needed
      });

      return response.data;
    } catch (error) {
      this.handleError(error, url);
      throw error;
    }
  }

  // Error handling method
  private handleError(error: any, url: string): void {
    console.error("API call failed:", error?.response, url);
  }
}

// Example usage:
const BASE_URL = "https://dapp.devdock.ai";
const apiService = new ApiService(BASE_URL);

export default apiService;
