"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Loader2,
  X,
  TrendingUp,
  TrendingDown,
  GitCompareArrows,
} from "lucide-react";
import clsx from "clsx";
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
  if (!history || history.length === 0) return <span className="text-xs text-gray-400">—</span>;
  const sorted = [...history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const oldest = sorted[0];
  const diff = current - oldest.applicationCount;
  if (diff === 0) return <span className="text-xs text-gray-400">—</span>;
  return (
    <span className={clsx("text-xs font-medium flex items-center gap-0.5", diff > 0 ? "text-green-600" : "text-red-600")}>
      {diff > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {diff > 0 ? "+" : ""}{diff}
    </span>
  );
}

function ComparePage() {
  const [shortlistedProblems, setShortlistedProblems] = useState<ProblemStatement[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchShortlisted() {
    try {
      const res = await fetch("/api/shortlist");
      if (res.ok) {
        const data = await res.json();
        setShortlistedProblems(data);
      }
    } catch (e) {
      console.error("Failed to fetch shortlist", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchShortlisted();
  }, []);

  const selected = useMemo(
    () => shortlistedProblems.filter((p) => selectedIds.includes(p.id)),
    [shortlistedProblems, selectedIds]
  );

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
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Compare Shortlisted Problem Statements</h1>
          <p className="text-sm text-gray-500">Select 2-5 shortlisted PSs to compare side by side</p>
        </div>
        {shortlistedProblems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <GitCompareArrows className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p>No shortlisted problems yet. Add some from the problem list or detail page.</p>
            <Link href="/problems" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
              Browse Problems →
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <select
              multiple
              value={selectedIds.map(String)}
              onChange={(e) => {
                const options = Array.from(e.target.selectedOptions).map((o) => parseInt(o.value));
                setSelectedIds(options.slice(0, 5));
              }}
              className="flex-1 min-w-[250px] h-24 px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 text-sm"
              size={8}
            >
              {shortlistedProblems.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.psId} - {p.title}
                </option>
              ))}
            </select>
            {selectedIds.length > 0 && (
              <span className="text-sm text-gray-500 self-center">
                {selectedIds.length}/5 selected
              </span>
            )}
          </div>
        )}
      </div>

      {shortlistedProblems.length === 0 ? null : selected.length === 0 ? (
        <div className="text-center py-12">
          <GitCompareArrows className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Select problem statements to compare</h2>
          <p className="text-gray-500">Choose 2-5 PSs from the dropdown above</p>
        </div>
      ) : selected.length === 1 ? (
        <div className="text-center py-12 text-yellow-600">
          <p>Select at least 2 problem statements to compare</p>
        </div>
      ) : (
        <>
          {/* Metric comparison table */}
          <div className="bg-white rounded border border-gray-200 overflow-hidden mb-6">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-48">Metric</th>
                  {selected.map((p) => (
                    <th key={p.id} className="px-3 py-2 text-left text-sm font-medium text-gray-900">
                      <Link href={`/problems/${p.id}`} className="hover:underline">
                        {p.psId}
                      </Link>
                      <div className="text-xs text-gray-500 truncate max-w-xs">{p.title}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => (
                  <tr key={m.key} className="border-b border-gray-100">
                    <td className="px-3 py-2 text-sm font-medium text-gray-600">{m.label}</td>
                    {selected.map((p) => (
                      <td key={p.id} className="px-3 py-2 text-sm text-gray-900">
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
                <tr className="border-b border-gray-100 bg-gray-50">
                  <td className="px-3 py-2 text-sm font-medium text-gray-600">Growth (total)</td>
                  {selected.map((p) => (
                    <td key={p.id} className="px-3 py-2 text-sm text-gray-900">
                      {p.history && p.history.length > 1 ? (
                        () => {
                          const sorted = [...p.history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                          const oldest = sorted[0];
                          const diff = p.applicationCount - oldest.applicationCount;
                          const pct = oldest.applicationCount > 0 ? Math.round((diff / oldest.applicationCount) * 1000) / 10 : 0;
                          return (
                            <span className={clsx("font-medium", diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-gray-400")}>
                              {diff > 0 ? "+" : ""}{diff} ({pct > 0 ? "+" : ""}{pct}%)
                            </span>
                          );
                        }
                      )() : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Application history chart comparison */}
          {selected.some((p) => p.history && p.history.length >= 2) && (
            <div className="bg-white rounded border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Application History Comparison</h3>
              <div className="h-64">
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
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value: any) => [value?.toLocaleString() || "0", "Applications"]}
                      contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "4px" }}
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
    </div>
  );
}

export default ComparePage;