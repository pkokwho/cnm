import { store } from "@/lib/store";

// OCR timeout in milliseconds (15 seconds)
// Tesseract.js needs to download ~27MB language data + run CPU-intensive OCR
// On Vercel serverless, this can easily exceed the function timeout
const OCR_TIMEOUT_MS = 15000;

/**
 * Process an image using OCR (Tesseract.js) to extract text.
 * Includes a timeout to prevent hanging on Vercel serverless.
 * Returns empty string if OCR fails or times out — analysis continues with other materials.
 */
export async function processImage(storageKey: string): Promise<string> {
  try {
    const buffer = store.getFileBuffer(storageKey);
    if (!buffer) {
      return "";
    }

    // On Vercel, OCR may timeout or fail. We use a timeout wrapper
    // and gracefully return empty text if it fails.
    const ocrPromise = performOCR(buffer);
    const timeoutPromise = new Promise<string>((resolve) => {
      setTimeout(() => {
        console.warn("OCR timed out after", OCR_TIMEOUT_MS, "ms, continuing without OCR text");
        resolve("");
      }, OCR_TIMEOUT_MS);
    });

    return await Promise.race([ocrPromise, timeoutPromise]);
  } catch (error) {
    console.error("OCR processing error:", error);
    return "";
  }
}

async function performOCR(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import to avoid loading Tesseract on startup
    const Tesseract = (await import("tesseract.js")).default;

    const result = await Tesseract.recognize(buffer, "chi_sim+eng", {
      logger: (_m: any) => {
        // Progress available as m.progress (0-1) when m.status === "recognizing text"
      },
    });

    return (result?.data?.text || "").trim();
  } catch (error) {
    console.error("OCR recognition failed:", error);
    return "";
  }
}
