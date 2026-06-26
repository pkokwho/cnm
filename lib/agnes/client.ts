import OpenAI from "openai";
import { AGNES_CONFIG } from "./config";

let clientInstance: OpenAI | null = null;

export function getAgnesClient(): OpenAI {
  if (!clientInstance) {
    clientInstance = new OpenAI({
      apiKey: AGNES_CONFIG.apiKey,
      baseURL: AGNES_CONFIG.baseURL,
    });
  }
  return clientInstance;
}
