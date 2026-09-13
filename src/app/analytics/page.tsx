"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  BarChart3,
  TrendingUp,
  TrendingDown,
  FileText,
  Globe,
  Users,
  Layers,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
} from "recharts";
import clsx from "clsx";

interface AnalyticsData {
  totalPS: number;
  totalApplications: number;
  averageApplications: number;
  medianApplications: number;
  highestApplications: { psId: string; count: number } | null;
  lowestApplications: { psId: string; count: number } | null;
  byTheme: { theme: string; count: number; avgApplications: number }[];
  byOrganization: { organization: string; count: number; avgApplications: number }[];
  byCategory: { category: string; count: number }[];
  competitionDistribution: { level: string; count: number }[];
  applicationDistribution: { range: string; count: number }[];
}

const COMPETITION_COLORS: Record<string, string> = {
  "Very High": "#ef4444",
  High: "#f97316",
  Medium: "#eab308",
  Low: "#22c55e",
};

const COLORS = [
  "#3b82f6", "#22c55e", "#f97316", "#eab308", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f43f5e", "#6366f1",
];

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: React.FC<{ className?: string; style?: React.CSSProperties }>; color: string }) {
  return (
    <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{value}</p>
        </div>
        <Icon className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" style={{ color }} />
      </div>
    </div>
  );
}

function CompetitionBadge({ level }: { level: string }) {
  return (
    <span className="px-2 py-0.5 text-xs font-medium rounded" style={{
      backgroundColor: COMPETITION_COLORS[level] + "20",
      color: COMPETITION_COLORS[level],
    }}>
      {level}
    </span>
  );
}

function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    try {
      const res = await fetch("/api/analytics");
      if (!res.ok) throw new Error("Failed to fetch");
      setData(await res.json());
    } catch (e) {
      setError("Failed to load analytics");
    } finally {
      setLoading(false);
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

  if (!data || error) {
    return (
      <div className="p-6 text-center text-red-600">
        {error || "No data available"}
      </div>
    );
  }

  const competitionData = data.competitionDistribution.map((d) => ({
    ...d,
    color: COMPETITION_COLORS[d.level] || "#6b7280",
  }));

  const categoryData = data.byCategory.slice(0, 8);
  const themeData = data.byTheme.slice(0, 10);
  const orgData = data.byOrganization.slice(0, 10);

  return (
    <div className="p-3 sm:p-4 md:p-6 pb-20 lg:pb-6">
      <h1 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <StatCard title="Tracked PSs" value={data.totalPS} icon={FileText} color="#3b82f6" />
        <StatCard title="Total Apps" value={data.totalApplications.toLocaleString()} icon={Users} color="#22c55e" />
        <StatCard title="Avg Apps" value={data.averageApplications} icon={BarChart3} color="#f97316" />
        <StatCard title="Median" value={data.medianApplications} icon={TrendingUp} color="#8b5cf6" />
        <StatCard
          title="Most Comp."
          value={data.highestApplications?.psId || "—"}
          icon={TrendingUp}
          color="#ef4444"
        />
        <StatCard
          title="Least Comp."
          value={data.lowestApplications?.psId || "—"}
          icon={TrendingDown}
          color="#22c55e"
        />
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Competition Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 sm:mb-4">Competition Level Distribution</h2>

          {/* Mobile: bar chart instead of pie */}
          <div className="sm:hidden mb-3 space-y-2">
            {competitionData.map((d) => (
              <div key={d.level} className="flex items-center gap-2">
                <span className="w-20 text-xs text-gray-600">{d.level}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${(d.count / data.totalPS) * 100}%`,
                      backgroundColor: d.color,
                    }}
                  />
                </div>
                <span className="text-xs text-gray-600 w-12 text-right">{d.count}</span>
              </div>
            ))}
          </div>

          {/* Desktop: pie chart */}
          <div className="hidden sm:block">
            <div className="flex flex-wrap gap-2 mb-4">
              {competitionData.map((d) => (
                <div key={d.level} className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded" style={{ backgroundColor: d.color }} />
                  <span className="text-sm text-gray-700">{d.level}: {d.count} ({((d.count / data.totalPS) * 100).toFixed(1)}%)</span>
                </div>
              ))}
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={competitionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="count"
                    nameKey="level"
                    label={({ name, value, percent = 0 }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                    labelLine={false}
                  >
                    {competitionData.map((d, i) => (
                      <Cell key={d.level} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "4px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Category & Theme Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 sm:mb-4">By Category</h2>
            <div className="h-52 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={100} />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "4px", fontSize: "12px" }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 sm:mb-4">By Theme (Top 10)</h2>
            <div className="h-52 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={themeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="theme" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={120} />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "4px", fontSize: "12px" }} />
                  <Bar dataKey="count" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Organization & Application Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 sm:mb-4">By Organization (Top 10)</h2>
            <div className="h-52 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orgData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="organization" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={130} />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "4px", fontSize: "12px" }} />
                  <Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 sm:mb-4">Application Count Distribution</h2>
            <div className="h-52 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.applicationDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="range" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "4px", fontSize: "12px" }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tables - scrollable on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 sm:mb-4">Theme Details</h2>
            <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500">Theme</th>
                    <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500">PSs</th>
                    <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500">Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byTheme.map((t) => (
                    <tr key={t.theme} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-2 sm:px-3 py-2 text-gray-900 text-xs sm:text-sm truncate max-w-[150px] sm:max-w-xs">{t.theme}</td>
                      <td className="px-2 sm:px-3 py-2 text-gray-600 text-xs sm:text-sm">{t.count}</td>
                      <td className="px-2 sm:px-3 py-2 text-gray-600 text-xs sm:text-sm">{t.avgApplications}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 sm:mb-4">Organization Details</h2>
            <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500">Organization</th>
                    <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500">PSs</th>
                    <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500">Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byOrganization.map((o) => (
                    <tr key={o.organization} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-2 sm:px-3 py-2 text-gray-900 text-xs sm:text-sm truncate max-w-[150px] sm:max-w-xs">{o.organization}</td>
                      <td className="px-2 sm:px-3 py-2 text-gray-600 text-xs sm:text-sm">{o.count}</td>
                      <td className="px-2 sm:px-3 py-2 text-gray-600 text-xs sm:text-sm">{o.avgApplications}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;
