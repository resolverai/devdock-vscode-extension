import axios from "axios";
import { StreamRequest } from "../common/types";
import apiService from "../services/apiService";
import { safeParseJsonResponse } from "./utils";
import https from "https";
import http from "http";

export async function streamResponse(request: StreamRequest) {
  const { body, options, onData, onEnd, onError, onStart } = request;

  try {
    const url = `${options.hostname}:${options.port}${options.path}`;

    // https://api.devdock.ai:443/bot/d0e809f1-dc89-4c91-8542-4eb9938526d2/api
    console.log("streamResponse", url, "\nbody", JSON.stringify(body));
    const fetchOptions = {
      method: options.method,
      headers: options.headers,
      body: JSON.stringify(body),
    };

    // Configure axios with extended timeout and streaming support
    const response = await axios({
      method: "post",
      url,
      data: body,
      headers: options.headers,
      timeout: 0, // No timeout (wait indefinitely)
      responseType: "stream", // Stream the response
      httpsAgent: new https.Agent({ keepAlive: true }),
      httpAgent: new http.Agent({ keepAlive: true }),
    });

    if (response.status !== 200) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    let buffer = "";

    onStart?.();

    // Read the stream data
    response.data.on("data", (chunk: Buffer) => {
      buffer += chunk.toString();
      let position;
      while ((position = buffer.indexOf("\n")) !== -1) {
        const line = buffer.substring(0, position);
        buffer = buffer.substring(position + 1);
        try {
          const json = safeParseJsonResponse(line);
          if (json) onData(json);
        } catch (e) {
          onError?.(new Error("Error parsing JSON data from event"));
        }
      }
    });

    response.data.on("end", () => {
      if (buffer) {
        try {
          const json = safeParseJsonResponse(buffer);
          onData(json);
        } catch (e) {
          onError?.(new Error("Error parsing JSON data from event"));
        }
      }
      onEnd?.();
    });

    response.data.on("error", (err: Error) => {
      onError?.(err);
    });
  } catch (error: unknown) {
    console.error("Fetch error:", error);
    onError?.(error as Error);
  }
}

export async function fetchEmbedding(request: StreamRequest) {
  const { body, options, onData } = request;
  const controller = new AbortController();

  try {
    const url = `${options.protocol}://${options.hostname}:${options.port}${options.path}`;
    const fetchOptions = {
      method: options.method,
      headers: options.headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    };

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`Server responded with status code: ${response.status}`);
    }

    if (!response.body) {
      throw new Error("Failed to get a ReadableStream from the response");
    }

    const data = await response.json();
    onData(data);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Fetch error:", error);
    }
  }
}
