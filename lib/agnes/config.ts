// Agnes AI configuration — server-side only
// API Key is read from environment variables and NEVER exposed to the client.

export const AGNES_CONFIG = {
  baseURL: process.env.AGNES_BASE_URL || "https://apihub.agnes-ai.com/v1",
  apiKey: process.env.AGNES_API_KEY || "",
  models: {
    chat: "agnes-2.0-flash",
    textToImage: "agnes-image-2.1-flash",
    imageToImage: "agnes-image-2.0-flash",
    video: "agnes-video-v2.0",
  },
  limits: {
    rpm: 18, // 20 RPM limit, leave 2 as buffer
    maxContextChars: 120000,
    maxAnalysisOutputTokens: 4096,
    maxChatOutputTokens: 2048,
    perMaterialCharLimit: 20000,
    chatPerMaterialCharLimit: 15000,
  },
};

export function isAIEnabled(): boolean {
  return !!AGNES_CONFIG.apiKey;
}
