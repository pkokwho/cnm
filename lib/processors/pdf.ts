import { store } from "@/lib/store";

export async function processPdf(
  storageKey: string
): Promise<{ text: string; needsOcr: boolean }> {
  try {
    const buffer = store.getFileBuffer(storageKey);
    if (!buffer) {
      return { text: "", needsOcr: false };
    }

    // Dynamic import to avoid issues if not used
    const pdfParseModule: any = await import("pdf-parse");
    const pdfParse =
      typeof pdfParseModule === "function"
        ? pdfParseModule
        : pdfParseModule.default || pdfParseModule;
    const data = await pdfParse(buffer);

    const text = data.text || "";
    // If text is very short, it's likely a scanned PDF
    const needsOcr = text.trim().length < 50;

    return { text: text.trim(), needsOcr };
  } catch (error) {
    console.error("PDF processing error:", error);
    return { text: "", needsOcr: false };
  }
}
