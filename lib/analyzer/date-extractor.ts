import { ExtractedDate } from "./types";

function normalizeDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getRelativeDateOffset(keyword: string): { days: number; months: number } | null {
  switch (keyword) {
    case "今天": return { days: 0, months: 0 };
    case "昨天": return { days: -1, months: 0 };
    case "前天": return { days: -2, months: 0 };
    case "明天": return { days: 1, months: 0 };
    case "后天": return { days: 2, months: 0 };
    case "大后天": return { days: 3, months: 0 };
    case "大前天": return { days: -3, months: 0 };
    case "上周": return { days: -7, months: 0 };
    case "下周": return { days: 7, months: 0 };
    case "上个月": return { days: 0, months: -1 };
    case "下个月": return { days: 0, months: 1 };
    default: return null;
  }
}

function applyOffset(baseDate: Date, offset: { days: number; months: number }): string {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + offset.days);
  d.setMonth(d.getMonth() + offset.months);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function extractDates(text: string): ExtractedDate[] {
  if (!text) return [];
  const results: ExtractedDate[] = [];
  const seen = new Set<string>();

  function getContext(matchStr: string, fullText: string, index: number): string {
    const start = Math.max(0, index - 40);
    const end = Math.min(fullText.length, index + matchStr.length + 40);
    return fullText.substring(start, end).trim();
  }

  function addResult(raw: string, normalized: string | null, context: string, time: string | null = null) {
    const key = `${raw}_${context.substring(0, 10)}`;
    if (seen.has(key)) return;
    seen.add(key);
    results.push({ raw, normalized, time, context });
  }

  // 1. Full Chinese dates: 2024年3月15日
  const fullChineseDateRe = /(\d{4})年(\d{1,2})月(\d{1,2})[日号]/g;
  let match;
  while ((match = fullChineseDateRe.exec(text)) !== null) {
    const normalized = normalizeDate(+match[1], +match[2], +match[3]);
    const context = getContext(match[0], text, match.index);
    addResult(match[0], normalized, context);
  }

  // 2. Chinese dates without year: 3月15日 (infer year from context)
  // Find the most common year in the text
  const yearMatches = [...text.matchAll(/(\d{4})年/g)];
  const inferredYear = yearMatches.length > 0
    ? +yearMatches[yearMatches.length - 1][1] // Use the last mentioned year
    : new Date().getFullYear();

  const monthDayRe = /(?<!\d年)(\d{1,2})月(\d{1,2})[日号]/g;
  while ((match = monthDayRe.exec(text)) !== null) {
    const normalized = normalizeDate(inferredYear, +match[1], +match[2]);
    const context = getContext(match[0], text, match.index);
    addResult(match[0], normalized, context);
  }

  // 3. ISO dates: 2024-03-15
  const isoDateRe = /(\d{4})-(\d{1,2})-(\d{1,2})/g;
  while ((match = isoDateRe.exec(text)) !== null) {
    const normalized = normalizeDate(+match[1], +match[2], +match[3]);
    const context = getContext(match[0], text, match.index);
    addResult(match[0], normalized, context);
  }

  // 4. Slash dates: 2024/03/15
  const slashDateRe = /(\d{4})\/(\d{1,2})\/(\d{1,2})/g;
  while ((match = slashDateRe.exec(text)) !== null) {
    const normalized = normalizeDate(+match[1], +match[2], +match[3]);
    const context = getContext(match[0], text, match.index);
    addResult(match[0], normalized, context);
  }

  // 5. Relative dates - resolve against nearest preceding absolute date if available
  const relativeKeywords = ["大前天", "前天", "昨天", "今天", "明天", "后天", "大后天", "上周", "下周", "上个月", "下个月"];
  for (const keyword of relativeKeywords) {
    const re = new RegExp(keyword, "g");
    while ((match = re.exec(text)) !== null) {
      const offset = getRelativeDateOffset(keyword);
      if (!offset) continue;

      // Find the nearest preceding absolute date in results
      const matchPos = match.index;
      let baseDate: Date | null = null;
      for (let i = results.length - 1; i >= 0; i--) {
        if (results[i].normalized && !relativeKeywords.includes(results[i].raw)) {
          // Check if this result's context is before the current match position
          const resultPos = text.indexOf(results[i].raw);
          if (resultPos >= 0 && resultPos < matchPos) {
            const [y, m, d] = results[i].normalized!.split("-").map(Number);
            baseDate = new Date(y, m - 1, d);
            break;
          }
        }
      }

      // Only add relative dates if we can resolve them against a preceding date
      // This prevents wrong "明天" resolutions using current date for historical texts
      if (baseDate) {
        const normalized = applyOffset(baseDate, offset);
        const context = getContext(match[0], text, match.index);
        addResult(match[0], normalized, context);
      }
    }
  }

  // 6. Times: 14:30, 下午2点, 上午10点半
  // Associate times with the nearest preceding date, don't create standalone time entries
  const timeRe = /(上午|下午|早上|晚上)?(\d{1,2})[:：点](\d{1,2})?分?/g;
  while ((match = timeRe.exec(text)) !== null) {
    let hour = +match[2];
    const minute = match[3] ? +match[3] : 0;
    if ((match[1] === "下午" || match[1] === "晚上") && hour < 12) hour += 12;
    if (hour > 23 || minute > 59) continue; // Skip invalid times
    const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

    // Find the nearest preceding date entry to associate this time with
    const matchPos = match.index;
    let associated = false;
    for (let i = results.length - 1; i >= 0; i--) {
      const resultPos = text.indexOf(results[i].raw);
      if (resultPos >= 0 && resultPos < matchPos && !results[i].time) {
        results[i].time = timeStr;
        associated = true;
        break;
      }
    }
    // If no date to associate with, skip this time (don't create null-date entries)
  }

  return results;
}
