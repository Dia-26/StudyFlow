export function safeJsonParse(rawText: unknown) {
  const raw = typeof rawText === "string" ? rawText : String(rawText ?? "");

  // Remove common markdown code fences
  let cleaned = raw.replace(/```\s*json\s*/gi, "").replace(/```/g, "").trim();

  // Find first JSON opening char
  const firstIdx = cleaned.search(/[\{\[]/);
  if (firstIdx === -1) {
    console.error("safeJsonParse: no JSON start found", { raw });
    return { data: null as null | unknown, raw };
  }

  cleaned = cleaned.slice(firstIdx);

  // Attempt to extract a balanced JSON block starting at first char
  const startChar = cleaned[0];
  const endChar = startChar === "{" ? "}" : "]";
  let depth = 0;
  let endIndex = -1;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === startChar) depth++;
    else if (ch === endChar) {
      depth--;
      if (depth === 0) {
        endIndex = i;
        break;
      }
    }
  }

  let candidate = endIndex >= 0 ? cleaned.slice(0, endIndex + 1) : cleaned;

  // Try parsing the candidate JSON block
  try {
    const parsed = JSON.parse(candidate);
    return { data: parsed, raw };
  } catch (err) {
    // Last-resort: try to find any JSON-like substring via regex
    try {
      const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return { data: parsed, raw };
      }
    } catch (_) {
      // fall through
    }

    console.error("safeJsonParse: failed to parse JSON", { raw, candidate, error: err });
    return { data: null as null | unknown, raw };
  }
}

export function ensureArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value == null) return [];
  return [value as T];
}
