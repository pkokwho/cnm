import { MaterialAnalysis, TimelineEntry } from "./types";
import { splitSentences } from "./tokenizers";

export function buildTimeline(analyses: MaterialAnalysis[]): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  for (const analysis of analyses) {
    // Group dates by normalized date to avoid duplicates within the same material
    const seenDates = new Set<string>();

    for (const date of analysis.dates) {
      // Skip entries without a normalized date (time-only entries)
      if (!date.normalized) continue;

      // Deduplicate: one entry per normalized date per material
      const dedupKey = `${date.normalized}_${analysis.materialId}`;
      if (seenDates.has(dedupKey)) continue;
      seenDates.add(dedupKey);

      // Get context sentences around the date
      const contextSentences = splitSentences(date.context);

      // Title: first meaningful sentence containing the date
      let title = "";
      for (const s of contextSentences) {
        if (s.includes(date.raw)) {
          // Remove the date and clean up leading/trailing punctuation
          let cleaned = s.replace(date.raw, "").trim();
          // Remove leading punctuation (commas, colons, spaces, etc.)
          cleaned = cleaned.replace(/^[\s，,。：:、；;（(]+/, "").trim();
          // Remove trailing punctuation
          cleaned = cleaned.replace(/[\s，,。：:、；;）)]+$/, "").trim();
          // Only use as title if it's meaningful (not just punctuation/numbers)
          if (cleaned && cleaned.length >= 2 && !/^[\d\s:：点上下午]+/.test(cleaned)) {
            title = cleaned;
            break;
          }
        }
      }
      // Fallback: use the date itself as title
      if (!title) {
        title = date.raw;
      }
      title = title.substring(0, 60);

      // Description: trimmed context (reduced from 200 to 150)
      const description = date.context.substring(0, 150).trim();

      entries.push({
        date: date.raw,
        normalizedDate: date.normalized,
        title,
        description,
        sourceMaterialId: analysis.materialId,
        sourceMaterialName: analysis.originalName,
      });
    }
  }

  // Sort chronologically by normalized date
  entries.sort((a, b) => {
    if (a.normalizedDate && b.normalizedDate) {
      return a.normalizedDate.localeCompare(b.normalizedDate);
    }
    if (a.normalizedDate) return -1;
    if (b.normalizedDate) return 1;
    return 0;
  });

  // Final deduplication: if multiple materials have the same date, keep them all
  // but limit total entries
  return entries.slice(0, 30);
}
