"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";

interface SyncLog {
  id: number;
  status: string;
  message: string;
  count: number;
  timestamp: string;
}

interface HistoryEntry {
  id: number;
  problemStatementId: number;
  applicationCount: number;
  previousCount: number;
  change: number;
  timestamp: string;
  source: string;
  problemStatement: { psId: string; title: string };
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx(
      "px-2 py-0.5 text-xs font-medium rounded",
      status === "success" ? "bg-green-100 text-green-800" :
      status === "error" ? "bg-red-100 text-red-800" :
      "bg-yellow-100 text-yellow-800"
    )}>
      {status}
    </span>
  );
}

function ChangeIndicator({ change }: { change: number }) {
  if (change === 0) return <span className="text-gray-400">—</span>;
  return (
    <span className={clsx("text-sm font-medium flex items-center gap-1", change > 0 ? "text-green-600" : "text-red-600")}>
      {change > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {change > 0 ? "+" : ""}{change}
    </span>
  );
}

function SyncLogCard({ log }: { log: SyncLog }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <StatusBadge status={log.status} />
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0">{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</span>
      </div>
      <p className="text-sm text-gray-900 mb-2">{log.message}</p>
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span>{log.count} PSs</span>
      </div>
    </div>
  );
}

function HistoryEntryCard({ h }: { h: HistoryEntry }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-mono text-gray-500 flex-shrink-0">{h.problemStatement.psId}</span>
        <span className="text-xs text-gray-400 flex-shrink-0">{formatDistanceToNow(new Date(h.timestamp), { addSuffix: true })}</span>
      </div>
      <p className="text-sm font-medium text-gray-900 mb-3 line-clamp-2">{h.problemStatement.title}</p>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 bg-gray-50 rounded">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Previous</p>
          <p className="text-sm font-mono text-gray-900">{h.previousCount.toLocaleString()}</p>
        </div>
        <div className="p-2 bg-gray-50 rounded">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">New</p>
          <p className="text-sm font-mono text-gray-900">{h.applicationCount.toLocaleString()}</p>
        </div>
        <div className="p-2 bg-gray-50 rounded">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Change</p>
          <ChangeIndicator change={h.change} />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
        <span className="capitalize">{h.source}</span>
      </div>
    </div>
  );
}

function HistoryPage() {
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    try {
      const [syncRes, histRes] = await Promise.all([
        fetch("/api/sync-logs"),
        fetch("/api/history"),
      ]);
      if (syncRes.ok) setSyncLogs(await syncRes.json());
      if (histRes.ok) setHistory(await histRes.json());
    } catch (e) {
      setError("Failed to load history");
    } finally {
      setLoading(false);
    }
  }

  async function triggerSync() {
    setError(null);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Sync failed");
      }
      await fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed");
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 pb-20 lg:pb-6">
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900">History & Sync</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Track application count changes and sync status</p>
        </div>
        <button
          onClick={triggerSync}
          className="w-full sm:w-auto px-4 py-2.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2 min-h-0"
        >
          <RefreshCw size={16} />
          Sync with SIH Website
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Sync Logs */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Sync Logs</h2>

        {/* Mobile: Card view */}
        <div className="sm:hidden space-y-3">
          {syncLogs.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500 text-sm">
              No sync logs yet
            </div>
          ) : (
            syncLogs.map((log) => <SyncLogCard key={log.id} log={log} />)
          )}
        </div>

        {/* Desktop: Table view */}
        <div className="hidden sm:block bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                </tr>
              </thead>
              <tbody>
                {syncLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No sync logs yet</td>
                  </tr>
                ) : (
                  syncLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100">
                      <td className="px-3 py-2">
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 max-w-md truncate">{log.message}</td>
                      <td className="px-3 py-2 text-sm text-gray-600">{log.count}</td>
                      <td className="px-3 py-2 text-sm text-gray-500">{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Application History */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Application Count Changes</h2>

        {/* Mobile: Card view */}
        <div className="sm:hidden space-y-3">
          {history.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500 text-sm">
              No history entries yet
            </div>
          ) : (
            history.slice(0, 100).map((h) => <HistoryEntryCard key={h.id} h={h} />)
          )}
        </div>

        {/* Desktop: Table view */}
        <div className="hidden sm:block bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">PS ID</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Previous</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">New</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Change</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No history entries yet</td>
                  </tr>
                ) : (
                  history.slice(0, 100).map((h) => (
                    <tr key={h.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono text-sm font-medium text-gray-900">{h.problemStatement.psId}</td>
                      <td className="px-3 py-2 text-sm text-gray-900 truncate max-w-xs">{h.problemStatement.title}</td>
                      <td className="px-3 py-2 text-sm text-gray-600">{h.previousCount.toLocaleString()}</td>
                      <td className="px-3 py-2 font-mono text-sm text-gray-900">{h.applicationCount.toLocaleString()}</td>
                      <td className="px-3 py-2"><ChangeIndicator change={h.change} /></td>
                      <td className="px-3 py-2 text-sm text-gray-500 capitalize">{h.source}</td>
                      <td className="px-3 py-2 text-sm text-gray-500">{formatDistanceToNow(new Date(h.timestamp), { addSuffix: true })}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {history.length > 100 && (
            <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500 text-center">
              Showing 100 of {history.length} entries
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HistoryPage;