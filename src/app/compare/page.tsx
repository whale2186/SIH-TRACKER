"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Loader2,
  X,
  TrendingUp,
  TrendingDown,
  GitCompareArrows,
  Check,
  Star,
} from "lucide-react";
import clsx from "clsx";
import { useShortlistStore } from "@/hooks/use-shortlist";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
} from "recharts";

interface ProblemStatement {
  id: number;
  psId: string;
  title: string;
  organization: string;
  category: string;
  theme: string;
  applicationCount: number;
  competitionLevel: string;
  datasetUrl: string;
  youtubeLinks: string;
  history: { timestamp: string; applicationCount: number }[];
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

function GrowthBadge({ current, history }: { current: number; history: { timestamp: string; applicationCount: number }[] }) {
  if (!history || history.length === 0) return <span className="text-xs text-muted-foreground/70">—</span>;
  const sorted = [...history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const oldest = sorted[0];
  const diff = current - oldest.applicationCount;
  if (diff === 0) return <span className="text-xs text-muted-foreground/70">—</span>;
  return (
    <span className={clsx("text-xs font-medium flex items-center gap-0.5", diff > 0 ? "text-green-600" : "text-red-600")}>
      {diff > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {diff > 0 ? "+" : ""}{diff}
    </span>
  );
}

function ComparePage() {
  const shortlistState = useShortlistStore();
  const [hydrated, setHydrated] = useState(false);
  const [shortlistedProblems, setShortlistedProblems] = useState<ProblemStatement[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const ids = Object.keys(shortlistState.items);
    if (ids.length === 0) {
      setShortlistedProblems([]);
      setLoading(false);
      return;
    }

    async function fetchProblems() {
      setLoading(true);
      try {
        const res = await fetch(`/api/problems?ids=${ids.join(",")}&limit=500`);
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setShortlistedProblems(json.data);
      } catch (e) {
        console.error("Failed to load freshly synced stats", e);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProblems();
  }, [hydrated, shortlistState.items]);

  const selected = useMemo(
    () => shortlistedProblems.filter((p) => selectedIds.includes(p.id)),
    [shortlistedProblems, selectedIds]
  );

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  };

  const metrics = [
    { key: "applicationCount", label: "Applications", format: (v: any) => v.toLocaleString() },
    { key: "competitionLevel", label: "Competition", format: (v: any) => v },
    { key: "category", label: "Type", format: (v: any) => v },
    { key: "theme", label: "Theme", format: (v: any) => v },
    { key: "datasetUrl", label: "Dataset", format: (v: any) => (v ? "Yes" : "No") },
    { key: "youtubeLinks", label: "Video", format: (v: any) => (v ? "Yes" : "No") },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/70" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 pb-20 lg:pb-6">
      <div className="mb-5">
        <h1 className="text-lg sm:text-xl font-semibold text-foreground">Compare Problem Statements</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Select 2–5 shortlisted PSs to compare side by side</p>
      </div>

      {shortlistedProblems.length === 0 ? (
        <div className="text-center py-12 sm:py-16">
          <GitCompareArrows className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm sm:text-base">No shortlisted problems yet.</p>
          <p className="text-muted-foreground/70 text-xs sm:text-sm mt-1">Add some from the problem list or detail page.</p>
          <Link href="/" className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-gray-800 transition">
            Browse Problems →
          </Link>
        </div>
      ) : (
        <>
          {/* ─── Selection: Chip-based picker (works on mobile + desktop) ─── */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Select to compare</span>
              {selectedIds.length > 0 && (
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-xs text-muted-foreground/70 hover:text-muted-foreground flex items-center gap-1 min-h-0"
                >
                  <X size={12} /> Clear
                </button>
              )}
            </div>
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {shortlistedProblems.map((p) => {
                const isSelected = selectedIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleSelection(p.id)}
                    className={clsx(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition min-h-0",
                      isSelected
                        ? "border-gray-900 bg-muted/50 ring-1 ring-gray-900"
                        : "border-border bg-card hover:bg-muted/50",
                      selectedIds.length >= 5 && !isSelected && "opacity-40 cursor-not-allowed"
                    )}
                    disabled={selectedIds.length >= 5 && !isSelected}
                  >
                    <div className={clsx(
                      "flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition",
                      isSelected ? "bg-primary border-gray-900" : "border-input"
                    )}>
                      {isSelected && <Check size={12} className="text-primary-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">{p.psId}</span>
                        <CompetitionBadge level={p.competitionLevel} />
                      </div>
                      <p className="text-sm text-foreground truncate">{p.title}</p>
                    </div>
                    <span className="flex-shrink-0 text-sm font-mono font-medium text-muted-foreground">
                      {p.applicationCount.toLocaleString()}
                    </span>
                  </button>
                );
              })}
            </div>
            {selectedIds.length > 0 && (
              <p className="text-xs text-muted-foreground/70 mt-2">{selectedIds.length}/5 selected</p>
            )}
          </div>

          {/* Empty / single selection state */}
          {selected.length === 0 ? (
            <div className="text-center py-10 sm:py-12">
              <GitCompareArrows className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-base sm:text-lg font-medium text-foreground mb-1">Select problem statements to compare</h2>
              <p className="text-muted-foreground text-xs sm:text-sm">Choose 2–5 PSs from above</p>
            </div>
          ) : selected.length === 1 ? (
            <div className="text-center py-10 text-yellow-600 text-sm">
              <p>Select at least 2 problem statements to compare</p>
            </div>
          ) : (
            <>
              {/* ═══ MOBILE: Stacked comparison cards ═══ */}
              <div className="sm:hidden space-y-4 mb-6">
                {selected.map((p) => (
                  <div key={p.id} className="bg-card rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Link href={`/problems/${p.id}`} className="text-xs font-mono text-muted-foreground hover:underline">{p.psId}</Link>
                      <button
                        onClick={() => toggleSelection(p.id)}
                        className="text-muted-foreground/70 hover:text-muted-foreground min-h-0 p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <p className="text-sm font-medium text-foreground mb-3 line-clamp-2">{p.title}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {metrics.map((m) => (
                        <div key={m.key} className="py-1.5">
                          <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">{m.label}</p>
                          <div className="text-sm text-foreground mt-0.5">
                            {m.key === "applicationCount" ? (
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold">{m.format(p.applicationCount)}</span>
                                <GrowthBadge current={p.applicationCount} history={p.history} />
                              </div>
                            ) : m.key === "competitionLevel" ? (
                              <CompetitionBadge level={p.competitionLevel} />
                            ) : (
                              <span className="truncate block">{m.format(p[m.key as keyof ProblemStatement] as string)}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* ═══ DESKTOP: Table comparison ═══ */}
              <div className="hidden sm:block bg-card rounded-lg border border-border overflow-hidden mb-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase w-48">Metric</th>
                        {selected.map((p) => (
                          <th key={p.id} className="px-3 py-2 text-left text-sm font-medium text-foreground">
                            <Link href={`/problems/${p.id}`} className="hover:underline">
                              {p.psId}
                            </Link>
                            <div className="text-xs text-muted-foreground truncate max-w-xs">{p.title}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.map((m) => (
                        <tr key={m.key} className="border-b border-border/50">
                          <td className="px-3 py-2 text-sm font-medium text-muted-foreground">{m.label}</td>
                          {selected.map((p) => (
                            <td key={p.id} className="px-3 py-2 text-sm text-foreground">
                              {m.key === "applicationCount" ? (
                                <>
                                  <span className="font-mono">{m.format(p.applicationCount)}</span>
                                  <GrowthBadge current={p.applicationCount} history={p.history} />
                                </>
                              ) : m.key === "competitionLevel" ? (
                                <CompetitionBadge level={p.competitionLevel} />
                              ) : (
                                m.format(p[m.key as keyof ProblemStatement] as string)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {/* Growth metrics */}
                      <tr className="border-b border-border/50 bg-muted/50">
                        <td className="px-3 py-2 text-sm font-medium text-muted-foreground">Growth (total)</td>
                        {selected.map((p) => (
                          <td key={p.id} className="px-3 py-2 text-sm text-foreground">
                            {p.history && p.history.length > 1 ? (
                              () => {
                                const sorted = [...p.history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                                const oldest = sorted[0];
                                const diff = p.applicationCount - oldest.applicationCount;
                                const pct = oldest.applicationCount > 0 ? Math.round((diff / oldest.applicationCount) * 1000) / 10 : 0;
                                return (
                                  <span className={clsx("font-medium", diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-muted-foreground/70")}>
                                    {diff > 0 ? "+" : ""}{diff} ({pct > 0 ? "+" : ""}{pct}%)
                                  </span>
                                );
                              }
                            )() : (
                              <span className="text-muted-foreground/70">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Application history chart - responsive */}
              {selected.some((p) => p.history && p.history.length >= 2) && (
                <div className="bg-card rounded-lg border border-border p-3 sm:p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Application History Comparison</h3>
                  <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={selected
                          .filter((p) => p.history && p.history.length >= 2)
                          .map((p) => ({
                            psId: p.psId,
                            data: [...p.history!]
                              .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                              .map((h) => ({
                                date: new Date(h.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                                count: h.applicationCount,
                              })),
                          }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                        <Tooltip
                          formatter={(value: any) => [value?.toLocaleString() || "0", "Applications"]}
                          contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "4px", fontSize: "12px" }}
                        />
                        {selected
                          .filter((p) => p.history && p.history.length >= 2)
                          .map((p, idx) => (
                            <Line
                              key={p.id}
                              dataKey={`count_${p.psId}`}
                              stroke={`hsl(${idx * 60 + 200}, 70%, 50%)`}
                              strokeWidth={2}
                              dot={false}
                              type="monotone"
                            />
                          ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default ComparePage;
