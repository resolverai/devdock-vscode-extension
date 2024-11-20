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
  // Method to send a query to ChatGPT-4 API
  // Method to send a question to ChatGPT-4 and get an answer
  async askChatGPT(
    question: string,
    model: string = "gpt-4",
    temperature: number = 0.7,
    listOfChains: string
  ): Promise<string> {
    const url = "https://api.openai.com/v1/chat/completions";

    // Log API key and post body for debugging
    console.log("API Key:", process.env.CHATGPT_API_KEY); // Ensure API key is printed correctly (remove after testing)

    const postBody = {
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a web3 helper, based on the user query you have to tell from which chain it belongs. The list of chains is as follows: " +
            listOfChains +
            ". You have to reply in just one word, and the answer should be one from the array of chains provided. If you think that the answer is not in the list, reply with 'OTHER'.",
        },
        { role: "user", content: question },
      ],
      temperature,
    };

    console.log("Post Body:", JSON.stringify(postBody, null, 2)); // Log post body to ensure correct structure

    try {
      const response: AxiosResponse = await axios.post(url, postBody, {
        headers: {
          Authorization: `Bearer ${process.env.CHATGPT_API_KEY}`, // Ensure API key is set in environment
          "Content-Type": "application/json",
        },
      });

      const answer = response.data.choices[0].message.content.trim();
      return answer;
    } catch (error: any) {
      console.error("Error querying ChatGPT-4 API:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
      }
      throw error;
    }
  }
}

// Example usage:
const BASE_URL = "https://dapp.devdock.ai";
const OPENAI_BASE_URL = "https://api.openai.com";
const apiService = new ApiService(BASE_URL);

export default apiService;
