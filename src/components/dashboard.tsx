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
  SlidersHorizontal,
  X,
} from "lucide-react";
import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";
import { useShortlistStore } from "@/hooks/use-shortlist";

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
  if (!previous) return <span className="text-xs text-muted-foreground/70">—</span>;
  const diff = current - previous;
  if (diff === 0) return <span className="text-xs text-muted-foreground/70">—</span>;
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
  if (!lastCheckedAt) return <span className="text-xs text-muted-foreground/70">Never</span>;
  try {
    const date = new Date(lastCheckedAt);
    if (isNaN(date.getTime())) return <span className="text-xs text-muted-foreground/70">Invalid</span>;
    const timeAgo = formatDistanceToNow(date, { addSuffix: true });
    const isManual = updateSource === "manual" || updateSource === "import";
    return (
      <span className="text-xs text-muted-foreground" title={updateSource}>
        {isManual ? "Manual " : ""}{timeAgo}
      </span>
    );
  } catch {
    return <span className="text-xs text-muted-foreground/70">Error</span>;
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
    <th className="cursor-pointer hover:bg-muted select-none" onClick={() => onSort(field)}>
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {isActive && (sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
        {!isActive && <ArrowUpDown size={12} className="text-gray-300" />}
      </div>
    </th>
  );
}

/* ─── Mobile Problem Card ─── */
function ProblemCard({ p }: { p: ProblemStatement }) {
  const shortlistState = useShortlistStore();
  const isShortlisted = !!shortlistState.items[p.id];
  const onShortlistToggle = () => shortlistState.toggle(p.id);
  const diff = p.applicationCount - p.previousApplicationCount;
  return (
    <div className="bg-card rounded-lg border border-border p-4 active:bg-muted/50 transition-colors">
      {/* Top row: PS ID + shortlist */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-muted-foreground">{p.psId}</span>
        <div className="flex items-center gap-2">
          <CompetitionBadge level={p.competitionLevel} />
          <button
            onClick={(e) => { e.preventDefault(); onShortlistToggle(); }}
            className={clsx(
              "p-1.5 rounded-md transition min-h-0",
              isShortlisted ? "text-yellow-500" : "text-gray-300"
            )}
          >
            <Star size={16} fill={isShortlisted ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {/* Title */}
      <Link href={`/problems/${p.id}`} className="block mb-2">
        <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{p.title}</h3>
      </Link>

      {/* Org */}
      <p className="text-xs text-muted-foreground truncate mb-3">{p.organization}</p>

      {/* Stats row */}
      <div className="flex items-center justify-between border-t border-border/50 pt-3">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-lg font-bold font-mono text-foreground leading-none">{p.applicationCount.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">applications</p>
          </div>
          {diff !== 0 && p.previousApplicationCount > 0 && (
            <div className={clsx("text-xs font-medium", diff > 0 ? "text-green-600" : "text-red-600")}>
              {diff > 0 ? <TrendingUp size={12} className="inline mr-0.5" /> : <TrendingDown size={12} className="inline mr-0.5" />}
              {diff > 0 ? "+" : ""}{diff}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="px-1.5 py-0.5 bg-muted text-muted-foreground rounded text-[10px] capitalize">{p.category}</span>
          <span className="px-1.5 py-0.5 bg-muted text-muted-foreground rounded text-[10px] max-w-[80px] truncate">{p.theme}</span>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const shortlistState = useShortlistStore();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
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
        sortBy,
        sortOrder,
        page: page.toString(),
        limit: limit.toString(),
      });
      // Handle local shortlist filter overriding
      if (shortlisted === "yes") {
        const localIds = Object.keys(shortlistState.items);
        if (localIds.length === 0) {
           setProblems([]);
           setTotalPages(1);
           setTotalCount(0);
           setLoading(false);
           return;
        }
        params.append("ids", localIds.join(","));
      } else if (shortlisted === "no") {
         // It's harder to invert ids in query easily without backend support, 
         // but we can pass it as excludedIds or something in the future.
         // For now let's just let it be, backend shortlist filter is deprecated anyway.
      }
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

  const activeFilterCount = [category, theme, organization, competition, shortlisted].filter(Boolean).length;

  const categories = Array.from(new Set(problems.map((p) => p.category).filter(Boolean))).sort();
  const themes = Array.from(new Set(problems.map((p) => p.theme).filter(Boolean))).sort();
  const organizations = Array.from(new Set(problems.map((p) => p.organization).filter(Boolean))).sort();

  if (loading && problems.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/70" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-foreground">SIH 2026 Tracker</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{totalCount} problem statements tracked</p>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <button
            onClick={() => applyQuickSort("lowest")}
            className="text-xs px-2.5 py-1.5 bg-muted text-muted-foreground rounded-md hover:bg-gray-200 min-h-0"
            title="Lowest applications first"
          >
            Lowest Apps
          </button>
          <button
            onClick={() => applyQuickSort("recent")}
            className="text-xs px-2.5 py-1.5 bg-muted text-muted-foreground rounded-md hover:bg-gray-200 min-h-0"
            title="Recently updated"
          >
            Recent
          </button>
          <button
            onClick={() => applyQuickSort("shortlist")}
            className="text-xs px-2.5 py-1.5 bg-muted text-muted-foreground rounded-md hover:bg-gray-200 min-h-0"
            title="My shortlist only"
          >
            ★ Shortlist
          </button>
        </div>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-4">
          <div className="bg-card p-3 rounded-lg border border-border">
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">Tracked</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{analytics.totalPS}</p>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border">
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">Total Apps</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{analytics.totalApplications.toLocaleString()}</p>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border">
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">Avg Apps</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{analytics.averageApplications}</p>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border">
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">Median</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{analytics.medianApplications}</p>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border">
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">Most Comp.</p>
            <p className="text-sm font-medium text-foreground truncate">
              {analytics.highestApplications?.psId || "—"}
            </p>
            <p className="text-xs text-muted-foreground">{analytics.highestApplications?.count || 0} apps</p>
          </div>
          <div className="bg-card p-3 rounded-lg border border-border">
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">Least Comp.</p>
            <p className="text-sm font-medium text-foreground truncate">
              {analytics.lowestApplications?.psId || "—"}
            </p>
            <p className="text-xs text-muted-foreground">{analytics.lowestApplications?.count || 0} apps</p>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-card rounded-lg border border-border p-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search PS ID, title, org..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 sm:py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-2.5 sm:py-2 text-sm border rounded-lg transition min-h-0",
              showFilters || activeFilterCount > 0
                ? "bg-primary text-primary-foreground border-gray-900"
                : "bg-card text-muted-foreground border-border hover:bg-muted/50"
            )}
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-card/20 text-primary-foreground text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Expandable filter section */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                className="text-sm px-3 py-2.5 sm:py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-card"
              >
                <option value="">All Categories</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={theme}
                onChange={(e) => { setTheme(e.target.value); setPage(1); }}
                className="text-sm px-3 py-2.5 sm:py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-card"
              >
                <option value="">All Themes</option>
                {themes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select
                value={organization}
                onChange={(e) => { setOrganization(e.target.value); setPage(1); }}
                className="text-sm px-3 py-2.5 sm:py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-card"
              >
                <option value="">All Organizations</option>
                {organizations.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              <select
                value={competition}
                onChange={(e) => { setCompetition(e.target.value); setPage(1); }}
                className="text-sm px-3 py-2.5 sm:py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-card"
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
                className="text-sm px-3 py-2.5 sm:py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-card"
              >
                <option value="">All</option>
                <option value="yes">Shortlisted</option>
                <option value="no">Not Shortlisted</option>
              </select>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={() => { setCategory(""); setTheme(""); setOrganization(""); setCompetition(""); setShortlisted(""); setPage(1); }}
                className="mt-2 text-xs text-muted-foreground hover:text-muted-foreground flex items-center gap-1 min-h-0"
              >
                <X size={12} /> Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mobile sort pills */}
      <div className="flex sm:hidden gap-1.5 mb-3 overflow-x-auto pb-1 -mx-1 px-1">
        {[
          { field: "applicationCount", label: "Apps" },
          { field: "competitionLevel", label: "Competition" },
          { field: "title", label: "Title" },
          { field: "organization", label: "Org" },
        ].map(({ field, label }) => (
          <button
            key={field}
            onClick={() => handleSort(field)}
            className={clsx(
              "flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-full whitespace-nowrap border transition min-h-0",
              sortBy === field
                ? "bg-primary text-primary-foreground border-gray-900"
                : "bg-card text-muted-foreground border-border"
            )}
          >
            {label}
            {sortBy === field && (sortOrder === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
          </button>
        ))}
      </div>

      {/* ═══ MOBILE: Card View ═══ */}
      <div className="sm:hidden space-y-2">
        {problems.length === 0 ? (
          <div className="bg-card rounded-lg border border-border p-8 text-center text-muted-foreground text-sm">
            No problem statements found. Try adjusting filters.
          </div>
        ) : (
          problems.map((p) => (
            <ProblemCard key={p.id} p={p} />
          ))
        )}
      </div>

      {/* ═══ DESKTOP: Table View ═══ */}
      <div className="hidden sm:block bg-card rounded-lg border border-border overflow-hidden">
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
                <th className="px-3 py-2 text-sm font-medium text-muted-foreground border-b border-border text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {problems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                    No problem statements found. Try adjusting filters.
                  </td>
                </tr>
              ) : (
                problems.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/50">
                    <td className="font-mono text-sm font-medium text-foreground">{p.psId}</td>
                    <td className="max-w-md">
                      <Link href={`/problems/${p.id}`} className="font-medium text-foreground hover:text-muted-foreground block truncate">
                        {p.title}
                      </Link>
                    </td>
                    <td className="text-sm text-muted-foreground truncate max-w-[180px]" title={p.organization}>{p.organization}</td>
                    <td className="text-sm text-muted-foreground capitalize">{p.category}</td>
                    <td className="text-sm text-muted-foreground truncate max-w-[140px]" title={p.theme}>{p.theme}</td>
                    <td className="font-mono text-sm font-medium text-foreground">{p.applicationCount.toLocaleString()}</td>
                    <td><GrowthIndicator current={p.applicationCount} previous={p.previousApplicationCount} /></td>
                    <td><CompetitionBadge level={p.competitionLevel} /></td>
                    <td><LastUpdated lastCheckedAt={p.lastCheckedAt} updateSource={p.updateSource} /></td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                                                <button
                          onClick={() => shortlistState.toggle(p.id)}
                          className={clsx(
                            "p-1.5 rounded hover:bg-muted transition min-h-0",
                            (hydrated && !!shortlistState.items[p.id]) ? "text-yellow-500" : "text-muted-foreground/70 hover:text-yellow-500"
                          )}
                          title={(hydrated && !!shortlistState.items[p.id]) ? "Remove from shortlist" : "Add to shortlist"}
                        >
                          <Star size={16} fill={(hydrated && !!shortlistState.items[p.id]) ? "currentColor" : "none"} />
                        </button>
                        <Link href={`/problems/${p.id}`} className="p-1.5 text-muted-foreground/70 hover:text-muted-foreground" title="View details">
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
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-3 px-1 sm:px-4 py-3 flex items-center justify-between">
          <span className="text-xs sm:text-sm text-muted-foreground">
            Page {page}/{totalPages} <span className="hidden sm:inline">({totalCount} total)</span>
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-3 py-1.5 sm:py-1 text-sm border border-border rounded-lg hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed min-h-0"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="px-3 py-1.5 sm:py-1 text-sm border border-border rounded-lg hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed min-h-0"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}
    </div>
  );
}
