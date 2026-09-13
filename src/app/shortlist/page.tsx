"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Star,
  Trash2,
  ArrowLeft,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";

interface ShortlistItem {
  id: number;
  problemStatementId: number;
  priority: string;
  notes: string;
  createdAt: string;
  problemStatement: {
    id: number;
    psId: string;
    title: string;
    applicationCount: number;
    competitionLevel: string;
    organization: string;
    category: string;
    theme: string;
  };
}

function CompetitionBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    "Very High": "bg-red-100 text-red-800",
    High: "bg-orange-100 text-orange-800",
    Medium: "bg-yellow-100 text-yellow-800",
    Low: "bg-green-100 text-green-800",
  };
  return (
    <span className={clsx("px-2 py-0.5 text-xs font-medium rounded", colors[level] || colors.Low)}>
      {level}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    High: "bg-red-100 text-red-800",
    Medium: "bg-yellow-100 text-yellow-800",
    Low: "bg-green-100 text-green-800",
  };
  return (
    <span className={clsx("px-2 py-0.5 text-xs font-medium rounded", colors[priority] || colors.Medium)}>
      {priority}
    </span>
  );
}

function ShortlistPage() {
  const [items, setItems] = useState<ShortlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/shortlist");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setItems(data);
    } catch (e) {
      setError("Failed to load shortlist");
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(id: number) {
    try {
      const res = await fetch(`/api/shortlist/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (e) {
      console.error("Failed to remove", e);
    }
  }

  async function updatePriority(id: number, priority: string) {
    try {
      const res = await fetch(`/api/shortlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error("Failed to update", e);
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

  if (items.length === 0) {
    return (
      <div className="p-6 text-center">
        <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-900 mb-2">No shortlisted Problem Statements</h2>
        <p className="text-gray-500 mb-4">Browse Problem Statements and click ⭐ to add one.</p>
        <Link href="/problems" className="inline-flex items-center gap-1 text-sm text-gray-900 hover:text-gray-700">
          <ArrowLeft size={16} />
          Browse Problem Statements
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">My Shortlist</h1>
        <p className="text-sm text-gray-500">{items.length} problem statements shortlisted</p>
      </div>

      <div className="bg-white rounded border border-gray-200 overflow-hidden">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">PS ID</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Problem Statement</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Applications</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Competition</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Org</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Theme</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Added</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 font-mono text-sm font-medium text-gray-900">{item.problemStatement.psId}</td>
                <td className="px-3 py-2">
                  <Link href={`/problems/${item.problemStatement.id}`} className="font-medium text-gray-900 hover:text-gray-700 block truncate max-w-md">
                    {item.problemStatement.title}
                  </Link>
                </td>
                <td className="px-3 py-2 font-mono text-sm text-gray-900">{item.problemStatement.applicationCount.toLocaleString()}</td>
                <td className="px-3 py-2"><CompetitionBadge level={item.problemStatement.competitionLevel} /></td>
                <td className="px-3 py-2 text-sm text-gray-600 truncate max-w-[150px]">{item.problemStatement.organization}</td>
                <td className="px-3 py-2 text-sm text-gray-600 capitalize">{item.problemStatement.category}</td>
                <td className="px-3 py-2 text-sm text-gray-600 truncate max-w-[120px]">{item.problemStatement.theme}</td>
                <td className="px-3 py-2">
                  <select
                    value={item.priority}
                    onChange={(e) => updatePriority(item.id, e.target.value)}
                    className="text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-900"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </td>
                <td className="px-3 py-2 text-sm text-gray-600 max-w-xs truncate" title={item.notes}>{item.notes || "—"}</td>
                <td className="px-3 py-2 text-sm text-gray-500">{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Remove from shortlist"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

export default ShortlistPage;