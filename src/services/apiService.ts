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

  // POST request for general APIs
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
  }
}

// Example usage:
const BASE_URL = "https://api.devdock.ai";
const apiService = new ApiService(BASE_URL);

export default apiService;
