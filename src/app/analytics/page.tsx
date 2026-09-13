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
    <div className="bg-white p-4 rounded border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <Icon className="h-8 w-8" style={{ color }} />
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
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        <StatCard title="Tracked PSs" value={data.totalPS} icon={FileText} color="#3b82f6" />
        <StatCard title="Total Applications" value={data.totalApplications.toLocaleString()} icon={Users} color="#22c55e" />
        <StatCard title="Avg Applications" value={data.averageApplications} icon={BarChart3} color="#f97316" />
        <StatCard title="Median" value={data.medianApplications} icon={TrendingUp} color="#8b5cf6" />
        <StatCard
          title="Most Competitive"
          value={data.highestApplications?.psId || "—"}
          icon={TrendingUp}
          color="#ef4444"
        />
        <StatCard
          title="Least Competitive"
          value={data.lowestApplications?.psId || "—"}
          icon={TrendingDown}
          color="#22c55e"
        />
      </div>

      <div className="space-y-6">
        {/* Competition Distribution */}
        <div className="bg-white rounded border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Competition Level Distribution</h2>
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

        {/* Category & Theme Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">By Category</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={140} />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "4px" }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">By Theme (Top 10)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={themeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="theme" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={180} />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "4px" }} />
                  <Bar dataKey="count" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Organization & Application Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">By Organization (Top 10)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orgData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="organization" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={200} />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "4px" }} />
                  <Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Application Count Distribution</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.applicationDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "4px" }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Theme Details</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Theme</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">PS Count</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Avg Apps</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byTheme.map((t) => (
                    <tr key={t.theme} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-900 truncate max-w-xs">{t.theme}</td>
                      <td className="px-3 py-2 text-gray-600">{t.count}</td>
                      <td className="px-3 py-2 text-gray-600">{t.avgApplications}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Organization Details</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Organization</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">PS Count</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Avg Apps</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byOrganization.map((o) => (
                    <tr key={o.organization} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-900 truncate max-w-xs">{o.organization}</td>
                      <td className="px-3 py-2 text-gray-600">{o.count}</td>
                      <td className="px-3 py-2 text-gray-600">{o.avgApplications}</td>
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