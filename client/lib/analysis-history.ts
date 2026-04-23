/**
 * Local persistence for AI analysis runs.
 *
 * Every analysis invocation (portfolio / compare / deploy / behavior / swing /
 * stock-details) writes its result into AsyncStorage keyed by type + subject.
 * A screen re-mount (or closing and reopening the app) reads the most recent
 * saved result so the user sees what they analysed last time — no repeat fetch.
 *
 * Also exposes the full history list so a screen can render "past runs with
 * timestamps" that stay there until the user clears them.
 *
 * Storage layout:
 *   @analysis-history:v1:index        → string[] of sessionIds (most recent first)
 *   @analysis-history:v1:<sessionId>  → AnalysisSession JSON
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const INDEX_KEY = "@analysis-history:v1:index";
const SESSION_PREFIX = "@analysis-history:v1:";
const MAX_HISTORY = 50;

export type AnalysisType =
  | "portfolio"
  | "compare"
  | "deploy"
  | "behavior"
  | "swing"
  | "stock-details";

export interface AnalysisSession {
  sessionId: string;          // "portfolio:2026-04-22T05:19:00.000Z"
  type: AnalysisType;
  subject: string;            // OLFI / "OLFI,COMI" / "" for portfolio
  runAt: string;              // ISO timestamp
  elapsedMs?: number;
  provider?: string;          // "gemini-2.5-flash" / "multi"
  result: unknown;            // raw result payload (shape depends on type)
  error?: string;
}

function buildSessionId(type: AnalysisType, subject: string, runAt: string): string {
  return `${type}:${subject || "_"}:${runAt}`;
}

async function readIndex(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeIndex(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(ids));
}

export async function saveSession(
  input: Omit<AnalysisSession, "sessionId" | "runAt"> & { runAt?: string }
): Promise<AnalysisSession> {
  const runAt = input.runAt ?? new Date().toISOString();
  const sessionId = buildSessionId(input.type, input.subject, runAt);
  const session: AnalysisSession = { ...input, sessionId, runAt };

  await AsyncStorage.setItem(
    SESSION_PREFIX + sessionId,
    JSON.stringify(session)
  );

  const index = await readIndex();
  const next = [sessionId, ...index.filter((id) => id !== sessionId)].slice(0, MAX_HISTORY);
  await writeIndex(next);

  // Garbage-collect sessions that fell off the MAX_HISTORY tail.
  const dropped = index.filter((id) => !next.includes(id));
  if (dropped.length > 0) {
    await AsyncStorage.multiRemove(dropped.map((id) => SESSION_PREFIX + id));
  }

  return session;
}

export async function listSessions(filter?: {
  type?: AnalysisType;
  subject?: string;
}): Promise<AnalysisSession[]> {
  const index = await readIndex();
  if (index.length === 0) return [];

  const keys = index.map((id) => SESSION_PREFIX + id);
  const pairs = await AsyncStorage.multiGet(keys);
  const sessions: AnalysisSession[] = [];
  for (const [, value] of pairs) {
    if (!value) continue;
    try {
      const s = JSON.parse(value) as AnalysisSession;
      if (filter?.type && s.type !== filter.type) continue;
      if (filter?.subject && s.subject !== filter.subject) continue;
      sessions.push(s);
    } catch {
      // ignore corrupt entries
    }
  }
  return sessions;
}

export async function getLatestSession(
  type: AnalysisType,
  subject = ""
): Promise<AnalysisSession | null> {
  const list = await listSessions({ type, subject });
  return list[0] ?? null;
}

export async function clearSessions(filter?: { type?: AnalysisType }): Promise<number> {
  const index = await readIndex();
  if (index.length === 0) return 0;

  if (!filter?.type) {
    const keys = index.map((id) => SESSION_PREFIX + id);
    await AsyncStorage.multiRemove(keys);
    await writeIndex([]);
    return index.length;
  }

  const keep: string[] = [];
  const remove: string[] = [];
  for (const id of index) {
    if (id.startsWith(`${filter.type}:`)) {
      remove.push(id);
    } else {
      keep.push(id);
    }
  }
  if (remove.length === 0) return 0;
  await AsyncStorage.multiRemove(remove.map((id) => SESSION_PREFIX + id));
  await writeIndex(keep);
  return remove.length;
}

export function formatRunAt(isoTimestamp: string): string {
  const d = new Date(isoTimestamp);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString("en-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
