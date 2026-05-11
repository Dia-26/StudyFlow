type AiLogEntry = {
  id: string;
  route: string;
  timestamp: string;
  raw: string;
  parsed?: unknown;
  error?: string | null;
};

const MAX_ENTRIES = 200;

const entries: AiLogEntry[] = [];

export function pushAiLog(entry: Omit<AiLogEntry, 'id' | 'timestamp'>) {
  const now = new Date().toISOString();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const record: AiLogEntry = { id, timestamp: now, ...entry };
  entries.push(record);
  if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);
  // Keep logs in memory only
}

export function getAiLogs(limit = 100) {
  return entries.slice(-Math.max(0, Math.min(limit, entries.length)));
}

export function clearAiLogs() {
  entries.length = 0;
}
