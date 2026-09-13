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
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">History & Sync</h1>
          <p className="text-sm text-gray-500">Track application count changes and sync status</p>
        </div>
        <button
          onClick={triggerSync}
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Sync with SIH Website
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Sync Logs */}
      <div className="bg-white rounded border border-gray-200 mb-6">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Sync Logs</h2>
        </div>
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
                      <span className={clsx(
                        "px-2 py-0.5 text-xs font-medium rounded",
                        log.status === "success" ? "bg-green-100 text-green-800" :
                        log.status === "error" ? "bg-red-100 text-red-800" :
                        "bg-yellow-100 text-yellow-800"
                      )}>
                        {log.status}
                      </span>
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

      {/* Application History */}
      <div className="bg-white rounded border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Application Count Changes</h2>
        </div>
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
                    <td className="px-3 py-2">
                      <span className={clsx("text-sm font-medium", h.change > 0 ? "text-green-600" : h.change < 0 ? "text-red-600" : "text-gray-400")}>
                        {h.change > 0 ? <TrendingUp size={12} className="inline" /> : h.change < 0 ? <TrendingDown size={12} className="inline" /> : null}
                        {h.change > 0 ? "+" : ""}{h.change}
                      </span>
                    </td>
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
  );
}

export default HistoryPage;