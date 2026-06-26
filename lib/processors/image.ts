import { store } from "@/lib/store";

export async function processImage(storageKey: string): Promise<string> {
  try {
    const buffer = store.getFileBuffer(storageKey);
    if (!buffer) {
      return "";
    }

    // Dynamic import to avoid loading Tesseract on startup
    const Tesseract = (await import("tesseract.js")).default;

    const result = await Tesseract.recognize(buffer, "chi_sim+eng", {
      logger: (_m: any) => {
        // Progress available as m.progress (0-1) when m.status === "recognizing text"
      },
    });

    return (result?.data?.text || "").trim();
  } catch (error) {
    console.error("OCR processing error:", error);
    return "";
  }
}
