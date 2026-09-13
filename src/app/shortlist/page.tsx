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
import { useShortlistStore } from "@/hooks/use-shortlist";

interface ProblemStatementInfo {
  id: number;
  psId: string;
  title: string;
  applicationCount: number;
  competitionLevel: string;
  organization: string;
  category: string;
  theme: string;
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
  const shortlistState = useShortlistStore();
  const [hydrated, setHydrated] = useState(false);
  const [problems, setProblems] = useState<Record<number, ProblemStatementInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const ids = Object.keys(shortlistState.items);
    if (ids.length === 0) {
      setLoading(false);
      return;
    }

    async function fetchProblems() {
      setLoading(true);
      try {
        const res = await fetch(`/api/problems?ids=${ids.join(",")}&limit=500`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        const problemMap: Record<number, ProblemStatementInfo> = {};
        for (const p of data.data) {
          problemMap[p.id] = p;
        }
        setProblems(problemMap);
      } catch (e) {
        console.error(e);
        setError("Failed to load freshly synced stats");
      } finally {
        setLoading(false);
      }
    }
    
    fetchProblems();
  }, [hydrated, shortlistState.items]);

  if (!hydrated || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/70" />
      </div>
    );
  }

  const items = Object.values(shortlistState.items)
    .filter((item) => problems[item.problemStatementId]) // only show if problem exists
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (items.length === 0) {
    return (
      <div className="p-6 text-center pb-20 lg:pb-6">
        <Star className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-base sm:text-lg font-medium text-foreground mb-2">No shortlisted Problem Statements</h2>
        <p className="text-sm text-muted-foreground mb-4">Browse Problem Statements and click ⭐ to add one.</p>
        <Link href="/" className="inline-block px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-gray-800 transition">
          <ArrowLeft size={14} className="inline mr-1.5" />
          Browse Problem Statements
        </Link>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 pb-20 lg:pb-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl font-semibold text-foreground">My Shortlist</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">{items.length} problem statements shortlisted</p>
      </div>

      {/* ═══ MOBILE: Card View ═══ */}
      <div className="sm:hidden space-y-3">
        {items.map((item) => {
          const problem = problems[item.problemStatementId];
          return (
          <div key={item.problemStatementId} className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">{problem.psId}</span>
                <PriorityBadge priority={item.priority} />
              </div>
              <button
                onClick={() => shortlistState.toggle(item.problemStatementId)}
                className="p-1.5 text-muted-foreground/70 hover:text-red-600 hover:bg-red-50 rounded min-h-0"
                title="Remove from shortlist"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <Link href={`/problems/${problem.id}`} className="block mb-3">
              <h3 className="text-sm font-medium text-foreground leading-snug line-clamp-2">{problem.title}</h3>
            </Link>

            <p className="text-xs text-muted-foreground truncate mb-3">{problem.organization}</p>

            <div className="flex items-center justify-between border-t border-border/50 pt-3">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-lg font-bold font-mono text-foreground leading-none">{problem.applicationCount.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">applications</p>
                </div>
                <CompetitionBadge level={problem.competitionLevel} />
              </div>
              <select
                value={item.priority}
                onChange={(e) => shortlistState.update(item.problemStatementId, e.target.value, item.notes)}
                className="text-xs px-2 py-1.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-card"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {item.notes && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-1 italic">&ldquo;{item.notes}&rdquo;</p>
            )}

            <div className="flex flex-wrap gap-1 mt-2">
              <span className="px-1.5 py-0.5 bg-muted text-muted-foreground rounded text-[10px] capitalize">{problem.category}</span>
              <span className="px-1.5 py-0.5 bg-muted text-muted-foreground rounded text-[10px] max-w-[100px] truncate">{problem.theme}</span>
            </div>
          </div>
        )})}
      </div>

      {/* ═══ DESKTOP: Table View ═══ */}
      <div className="hidden sm:block bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">PS ID</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Problem Statement</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Applications</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Competition</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Org</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Theme</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Priority</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Notes</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Added</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const problem = problems[item.problemStatementId];
                return (
                <tr key={item.problemStatementId} className="border-b border-border/50 hover:bg-muted/50">
                  <td className="px-3 py-2 font-mono text-sm font-medium text-foreground">{problem.psId}</td>
                  <td className="px-3 py-2">
                    <Link href={`/problems/${problem.id}`} className="font-medium text-foreground hover:text-muted-foreground block truncate max-w-md">
                      {problem.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2 font-mono text-sm text-foreground">{problem.applicationCount.toLocaleString()}</td>
                  <td className="px-3 py-2"><CompetitionBadge level={problem.competitionLevel} /></td>
                  <td className="px-3 py-2 text-sm text-muted-foreground truncate max-w-[150px]">{problem.organization}</td>
                  <td className="px-3 py-2 text-sm text-muted-foreground capitalize">{problem.category}</td>
                  <td className="px-3 py-2 text-sm text-muted-foreground truncate max-w-[120px]">{problem.theme}</td>
                  <td className="px-3 py-2">
                    <select
                      value={item.priority}
                      onChange={(e) => shortlistState.update(item.problemStatementId, e.target.value, item.notes)}
                      className="text-xs px-2 py-1 border border-border rounded focus:outline-none focus:ring-1 focus:ring-gray-900"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 text-sm text-muted-foreground max-w-xs truncate" title={item.notes}>{item.notes || "—"}</td>
                  <td className="px-3 py-2 text-sm text-muted-foreground">{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => shortlistState.toggle(item.problemStatementId)}
                      className="p-1.5 text-muted-foreground/70 hover:text-red-600 hover:bg-red-50 rounded min-h-0"
                      title="Remove from shortlist"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

export default ShortlistPage;
