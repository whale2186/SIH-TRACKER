import { differenceInHours, differenceInDays, parseISO } from 'date-fns';

export interface VelocityMetrics {
  today: number;
  last24h: number;
  last7d: number;
  perHour: number;
  avgDailyGrowth: number;
  percentGrowth: number;
}

export interface HistoryEntry {
  applicationCount: number;
  timestamp: Date | string;
}

export function calculateVelocity(history: HistoryEntry[], currentCount: number): VelocityMetrics {
  const now = new Date();
  const defaults: VelocityMetrics = {
    today: 0, last24h: 0, last7d: 0, perHour: 0, avgDailyGrowth: 0, percentGrowth: 0,
  };
  if (!history || history.length === 0) return defaults;

  const sorted = [...history].sort((a, b) => {
    const ta = typeof a.timestamp === 'string' ? parseISO(a.timestamp) : a.timestamp;
    const tb = typeof b.timestamp === 'string' ? parseISO(b.timestamp) : b.timestamp;
    return ta.getTime() - tb.getTime();
  });

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const h24ago = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const d7ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const findClosestBefore = (cutoff: Date): HistoryEntry | null => {
    let closest: HistoryEntry | null = null;
    for (const entry of sorted) {
      const t = typeof entry.timestamp === 'string' ? parseISO(entry.timestamp) : entry.timestamp;
      if (t <= cutoff) closest = entry;
    }
    return closest;
  };

  const beforeToday = findClosestBefore(todayStart);
  const before24h = findClosestBefore(h24ago);
  const before7d = findClosestBefore(d7ago);
  const oldest = sorted[0];
  const oldestTime = typeof oldest.timestamp === 'string' ? parseISO(oldest.timestamp) : oldest.timestamp;

  const today = beforeToday ? currentCount - beforeToday.applicationCount : 0;
  const last24h = before24h ? currentCount - before24h.applicationCount : 0;
  const last7d = before7d ? currentCount - before7d.applicationCount : 0;

  const totalHours = Math.max(differenceInHours(now, oldestTime), 1);
  const totalDays = Math.max(differenceInDays(now, oldestTime), 1);
  const totalChange = currentCount - oldest.applicationCount;

  const perHour = Math.round((totalChange / totalHours) * 10) / 10;
  const avgDailyGrowth = Math.round((totalChange / totalDays) * 10) / 10;
  const percentGrowth = oldest.applicationCount > 0
    ? Math.round((totalChange / oldest.applicationCount) * 1000) / 10
    : 0;

  return { today: Math.max(today, 0), last24h: Math.max(last24h, 0), last7d: Math.max(last7d, 0), perHour, avgDailyGrowth, percentGrowth };
}