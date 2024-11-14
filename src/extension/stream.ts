import axios from "axios";
import { StreamRequest } from "../common/types";
import apiService from "../services/apiService";
import { safeParseJsonResponse } from "./utils";
import https from "https";
import http from 'http';

export async function streamResponse(request: StreamRequest) {
  const { body, options, onData, onEnd, onError, onStart } = request;

  try {
    const url = `https://${options.hostname}:${options.port}${options.path}`;
    const fetchOptions = {
      method: options.method,
      headers: options.headers,
      body: JSON.stringify(body),
    };

    // const response = await fetch(url, fetchOptions);
    const response = await axios.post(url, body, {
      headers: options.headers,
      timeout: 60000, // Increased timeout to 60 seconds
      maxRedirects: 0, // Disable redirects if not needed
      maxContentLength: Infinity, // remove content-length restrictions if needed
      maxBodyLength: Infinity, // remove body-length restrictions if needed
      httpsAgent: new https.Agent({ keepAlive: true }),
      httpAgent: new http.Agent({ keepAlive: true }),
    });
    if (response.status !== 200) {
      throw new Error(
        `Server responded with status: ${JSON.stringify(response.status)}`
      );
    }

    if (!response.data) {
      throw new Error("Failed to get a ReadableStream from the response");
    }

    let buffer = "";

    onStart?.();

    const reader = response.data
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(
        new TransformStream({
          start() {
            buffer = "";
          },
          transform(chunk) {
            buffer += chunk;
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
          },
          flush() {
            if (buffer) {
              try {
                const json = safeParseJsonResponse(buffer);
                onData(json);
              } catch (e) {
                onError?.(new Error("Error parsing JSON data from event"));
              }
            }
          },
        })
      )
      .getReader();

    while (true) {
      const { done } = await reader.read();
      if (done) break;
    }

    onEnd?.();
    reader.releaseLock();
  } catch (error: unknown) {
    console.error("Fetch error:", error);
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
