"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Star,
  ArrowUpDown,
  Loader2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";

interface ProblemStatement {
  id: number;
  psId: string;
  title: string;
  organization: string;
  category: string;
  theme: string;
  applicationCount: number;
  previousApplicationCount: number;
  competitionLevel: string;
  updateSource: string;
  lastCheckedAt: string | null;
  shortlist: { priority: string } | null;
  history: { timestamp: string; applicationCount: number }[];
}

interface PaginatedResponse {
  data: ProblemStatement[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface AnalyticsData {
  totalPS: number;
  totalApplications: number;
  averageApplications: number;
  medianApplications: number;
  highestApplications: { psId: string; count: number } | null;
  lowestApplications: { psId: string; count: number } | null;
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

function GrowthIndicator({ current, previous }: { current: number; previous: number }) {
  if (!previous) return <span className="text-xs text-gray-400">—</span>;
  const diff = current - previous;
  if (diff === 0) return <span className="text-xs text-gray-400">—</span>;
  const isPositive = diff > 0;
  return (
    <span
      className={clsx(
        "text-xs font-medium flex items-center gap-0.5",
        isPositive ? "text-green-600" : "text-red-600"
      )}
    >
      {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {isPositive ? "+" : ""}{diff}
    </span>
  );
}

function LastUpdated({ lastCheckedAt, updateSource }: { lastCheckedAt: string | null; updateSource: string }) {
  if (!lastCheckedAt) return <span className="text-xs text-gray-400">Never</span>;
  try {
    const date = new Date(lastCheckedAt);
    if (isNaN(date.getTime())) return <span className="text-xs text-gray-400">Invalid</span>;
    const timeAgo = formatDistanceToNow(date, { addSuffix: true });
    const isManual = updateSource === "manual" || updateSource === "import";
    return (
      <span className="text-xs text-gray-500" title={updateSource}>
        {isManual ? "Manual " : ""}{timeAgo}
      </span>
    );
  } catch {
    return <span className="text-xs text-gray-400">Error</span>;
  }
}

function ColumnHeader({
  label,
  field,
  sortBy,
  sortOrder,
  onSort,
}: {
  label: string;
  field: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
}) {
  const isActive = sortBy === field;
  return (
    <th className="cursor-pointer hover:bg-gray-100 select-none" onClick={() => onSort(field)}>
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {isActive && (sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
        {!isActive && <ArrowUpDown size={12} className="text-gray-300" />}
      </div>
    </th>
  );
}

export function Dashboard() {
  const [problems, setProblems] = useState<ProblemStatement[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [theme, setTheme] = useState("");
  const [organization, setOrganization] = useState("");
  const [competition, setCompetition] = useState("");
  const [shortlisted, setShortlisted] = useState("");
  const [sortBy, setSortBy] = useState("applicationCount");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const limit = 50;

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        search,
        category,
        theme,
        organization,
        competition,
        shortlisted,
        sortBy,
        sortOrder,
        page: page.toString(),
        limit: limit.toString(),
      });
      const res = await fetch(`/api/problems?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json: PaginatedResponse = await res.json();
      setProblems(json.data);
      setTotalPages(json.pagination.totalPages);
      setTotalCount(json.pagination.total);
    } catch (e) {
      setError("Failed to load problem statements");
    } finally {
      setLoading(false);
    }
  }

  async function fetchAnalytics() {
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchData();
    fetchAnalytics();
  }, [search, category, theme, organization, competition, shortlisted, sortBy, sortOrder, page]);

  function handleSort(field: string) {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  }

  function applyQuickSort(preset: string) {
    switch (preset) {
      case "lowest":
        setSortBy("applicationCount");
        setSortOrder("asc");
        break;
      case "fastest":
        setSortBy("applicationCount");
        setSortOrder("desc");
        // Could add growth-based sort
        break;
      case "recent":
        setSortBy("updatedAt");
        setSortOrder("desc");
        break;
      case "shortlist":
        setShortlisted("yes");
        break;
    }
    setPage(1);
  }

  const categories = Array.from(new Set(problems.map((p) => p.category).filter(Boolean))).sort();
  const themes = Array.from(new Set(problems.map((p) => p.theme).filter(Boolean))).sort();
  const organizations = Array.from(new Set(problems.map((p) => p.organization).filter(Boolean))).sort();

  if (loading && problems.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">SIH 2026 Tracker</h1>
          <p className="text-sm text-gray-500">{totalCount} problem statements tracked</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => applyQuickSort("lowest")}
            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            title="Lowest applications first"
          >
            Lowest Apps
          </button>
          <button
            onClick={() => applyQuickSort("recent")}
            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            title="Recently updated"
          >
            Recently Updated
          </button>
          <button
            onClick={() => applyQuickSort("shortlist")}
            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            title="My shortlist only"
          >
            My Shortlist
          </button>
        </div>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
          <div className="bg-white p-3 rounded border border-gray-200">
            <p className="text-xs text-gray-500">Tracked PSs</p>
            <p className="text-2xl font-bold text-gray-900">{analytics.totalPS}</p>
          </div>
          <div className="bg-white p-3 rounded border border-gray-200">
            <p className="text-xs text-gray-500">Total Applications</p>
            <p className="text-2xl font-bold text-gray-900">{analytics.totalApplications.toLocaleString()}</p>
          </div>
          <div className="bg-white p-3 rounded border border-gray-200">
            <p className="text-xs text-gray-500">Avg Applications</p>
            <p className="text-2xl font-bold text-gray-900">{analytics.averageApplications}</p>
          </div>
          <div className="bg-white p-3 rounded border border-gray-200">
            <p className="text-xs text-gray-500">Median</p>
            <p className="text-2xl font-bold text-gray-900">{analytics.medianApplications}</p>
          </div>
          <div className="bg-white p-3 rounded border border-gray-200">
            <p className="text-xs text-gray-500">Most Competitive</p>
            <p className="text-sm font-medium text-gray-900 truncate">
              {analytics.highestApplications?.psId || "—"}
            </p>
            <p className="text-xs text-gray-500">{analytics.highestApplications?.count || 0} apps</p>
          </div>
          <div className="bg-white p-3 rounded border border-gray-200">
            <p className="text-xs text-gray-500">Least Competitive</p>
            <p className="text-sm font-medium text-gray-900 truncate">
              {analytics.lowestApplications?.psId || "—"}
            </p>
            <p className="text-xs text-gray-500">{analytics.lowestApplications?.count || 0} apps</p>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded border border-gray-200 p-3 mb-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search PS ID, title, org, theme, category..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>
          <div className="flex flex-wrap gap-2 md:flex-nowrap">
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="text-sm px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={theme}
              onChange={(e) => { setTheme(e.target.value); setPage(1); }}
              className="text-sm px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 max-w-xs"
            >
              <option value="">All Themes</option>
              {themes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              value={organization}
              onChange={(e) => { setOrganization(e.target.value); setPage(1); }}
              className="text-sm px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 max-w-xs"
            >
              <option value="">All Organizations</option>
              {organizations.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <select
              value={competition}
              onChange={(e) => { setCompetition(e.target.value); setPage(1); }}
              className="text-sm px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              <option value="">All Competition</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Very High">Very High</option>
            </select>
            <select
              value={shortlisted}
              onChange={(e) => { setShortlisted(e.target.value); setPage(1); }}
              className="text-sm px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              <option value="">All</option>
              <option value="yes">Shortlisted</option>
              <option value="no">Not Shortlisted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table w-full min-w-[900px]">
            <thead>
              <tr>
                <ColumnHeader label="PS ID" field="psId" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                <ColumnHeader label="Problem Statement" field="title" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                <ColumnHeader label="Organization" field="organization" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                <ColumnHeader label="Type" field="category" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                <ColumnHeader label="Theme" field="theme" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                <ColumnHeader label="Applications" field="applicationCount" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                <ColumnHeader label="Growth" field="growth" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                <ColumnHeader label="Competition" field="competitionLevel" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                <ColumnHeader label="Updated" field="lastCheckedAt" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                <th className="px-3 py-2 text-sm font-medium text-gray-600 border-b border-gray-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {problems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    No problem statements found. Try adjusting filters.
                  </td>
                </tr>
              ) : (
                problems.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="font-mono text-sm font-medium text-gray-900">{p.psId}</td>
                    <td className="max-w-md">
                      <Link href={`/problems/${p.id}`} className="font-medium text-gray-900 hover:text-gray-700 block truncate">
                        {p.title}
                      </Link>
                    </td>
                    <td className="text-sm text-gray-600 truncate max-w-[180px]" title={p.organization}>{p.organization}</td>
                    <td className="text-sm text-gray-600 capitalize">{p.category}</td>
                    <td className="text-sm text-gray-600 truncate max-w-[140px]" title={p.theme}>{p.theme}</td>
                    <td className="font-mono text-sm font-medium text-gray-900">{p.applicationCount.toLocaleString()}</td>
                    <td><GrowthIndicator current={p.applicationCount} previous={p.previousApplicationCount} /></td>
                    <td><CompetitionBadge level={p.competitionLevel} /></td>
                    <td><LastUpdated lastCheckedAt={p.lastCheckedAt} updateSource={p.updateSource} /></td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={async () => {
                            const res = await fetch(`/api/problems/${p.id}/shortlist`, { method: "POST" });
                            if (res.ok) fetchData();
                          }}
                          className={clsx(
                            "p-1.5 rounded hover:bg-gray-100 transition",
                            p.shortlist ? "text-yellow-500" : "text-gray-400 hover:text-yellow-500"
                          )}
                          title={p.shortlist ? "Remove from shortlist" : "Add to shortlist"}
                        >
                          <Star size={16} fill={p.shortlist ? "currentColor" : "none"} />
                        </button>
                        <Link href={`/problems/${p.id}`} className="p-1.5 text-gray-400 hover:text-gray-600" title="View details">
                          <span className="sr-only">View</span>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages} ({totalCount} total)
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}
    </div>
  );
}