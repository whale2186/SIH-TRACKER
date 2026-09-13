"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  GitCompareArrows,
  ExternalLink,
  Database,
  FileText,
  Link2,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  Globe,
  PlaySquare,
} from "lucide-react";
import clsx from "clsx";
import { formatDistanceToNow, differenceInDays, differenceInHours } from "date-fns";
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
  description: string;
  descriptionHtml: string;
  organization: string;
  department: string;
  category: string;
  theme: string;
  type: string;
  sourceUrl: string;
  applicationCount: number;
  previousApplicationCount: number;
  maxApplications: number;
  competitionLevel: string;
  status: string;
  datasetUrl: string;
  youtubeLinks: string;
  resourceLinks: string;
  updateSource: string;
  lastCheckedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  shortlist: { id: number; priority: string; notes: string } | null;
  history: { id: number; applicationCount: number; previousCount: number; change: number; timestamp: string; source: string }[];
  summary: { id: number; summary: string; model: string; generatedAt: string } | null;
}

interface Props {
  problem: ProblemStatement;
}

function CompetitionBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    "Very High": "bg-red-100 text-red-800 border-red-200",
    High: "bg-orange-100 text-orange-800 border-orange-200",
    Medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Low: "bg-green-100 text-green-800 border-green-200",
  };
  return (
    <span className={clsx("px-2 py-0.5 text-xs font-medium rounded border", colors[level] || colors.Low)}>
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 pb-2 border-b border-gray-200 flex items-center gap-2">
      {children}
    </h3>
  );
}

function InfoRow({ label, children, href }: { label: string; children: React.ReactNode; href?: string }) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 font-medium w-full sm:w-32 flex-shrink-0">{label}</span>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-900 hover:text-gray-700 flex items-center gap-1">
          {children}
          <ExternalLink size={12} />
        </a>
      ) : (
        <span className="text-sm text-gray-900">{children}</span>
      )}
    </div>
  );
}

export function ProblemDetailClient({ problem }: Props) {
  const router = useRouter();

  const handleShortlistToggle = async () => {
    try {
      const res = await fetch(`/api/problems/${problem.id}/shortlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: "Medium", notes: "" }),
      });
      if (res.ok) router.refresh();
    } catch (e) {
      console.error("Failed to toggle shortlist", e);
    }
  };

  const handleShortlistUpdate = async (priority: string, notes: string) => {
    try {
      await fetch(`/api/problems/${problem.id}/shortlist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority, notes }),
      });
      router.refresh();
    } catch (e) {
      console.error("Failed to update shortlist", e);
    }
  };

  // Prepare chart data
  const chartData = [...problem.history]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((h) => ({
      date: new Date(h.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: h.applicationCount,
    }));

  const showChart = chartData.length >= 2;

  // Data freshness
  const isStale = problem.lastCheckedAt ? differenceInDays(new Date(), new Date(problem.lastCheckedAt)) > 2 : true;
  const isManual = problem.updateSource === "manual" || problem.updateSource === "import";

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-4 md:p-6 pb-20 lg:pb-6">
      {/* Back button */}
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={16} />
        Back to tracker
      </Link>

      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div className="min-w-0">
            <span className="text-xs font-mono text-gray-500 mb-1 block">{problem.psId}</span>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">{problem.title}</h1>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleShortlistToggle}
              className={clsx(
                "p-2 sm:p-2.5 rounded-lg transition min-h-0",
                problem.shortlist
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
              title={problem.shortlist ? "Remove from shortlist" : "Add to shortlist"}
            >
              <Star size={18} className={problem.shortlist ? "text-currentColor" : "text-gray-400"} />
            </button>
            <Link
              href={`/compare?ids=${problem.id}`}
              className="p-2 sm:p-2.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition min-h-0"
              title="Add to comparison"
            >
              <GitCompareArrows size={18} />
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded capitalize">{problem.category}</span>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded">{problem.theme}</span>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded truncate max-w-[180px] sm:max-w-none">{problem.organization}</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500">Applications</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{problem.applicationCount.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">of {problem.maxApplications.toLocaleString()} max</p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500">Competition</p>
          <div className="flex items-center gap-2">
            <CompetitionBadge level={problem.competitionLevel} />
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500">Growth</p>
          <p className="text-lg font-bold text-gray-900">
            {problem.applicationCount - problem.previousApplicationCount >= 0 ? "+" : ""}
            {problem.applicationCount - problem.previousApplicationCount}
          </p>
          <p className="text-xs text-gray-500 mt-1">vs previous check</p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500">Data Status</p>
          <div className="flex items-center gap-1">
            {isManual ? (
              <>
                <span className="text-xs text-gray-600">Manual update</span>
              </>
            ) : isStale ? (
              <>
                <AlertTriangle size={14} className="text-yellow-600" />
                <span className="text-xs text-yellow-700">May be outdated</span>
              </>
            ) : (
              <>
                <CheckCircle size={14} className="text-green-600" />
                <span className="text-xs text-green-700">Synced</span>
              </>
            )}
          </div>
          {problem.lastCheckedAt && (
            <p className="text-xs text-gray-500 mt-1">
              Last checked: {formatDistanceToNow(new Date(problem.lastCheckedAt), { addSuffix: true })}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Problem Statement */}
        <section>
          <SectionTitle>
            <FileText size={14} />
            Official Problem Statement
          </SectionTitle>
          <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 prose prose-sm max-w-none">
            {problem.descriptionHtml
              ? <div className="ps-description text-sm text-gray-700 whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: problem.descriptionHtml }} />
              : <p className="text-sm text-gray-700 whitespace-pre-wrap">{problem.description}</p>}
          </div>
        </section>

        {/* Dataset */}
        {problem.datasetUrl && (
          <section>
            <SectionTitle>
              <Database size={14} />
              Dataset
            </SectionTitle>
            <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
              <a
                href={problem.datasetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-900 hover:text-gray-700 underline flex items-center gap-1 break-all"
              >
                <ExternalLink size={12} />
                {problem.datasetUrl}
              </a>
            </div>
          </section>
        )}

        {/* YouTube */}
        {problem.youtubeLinks && (
          <section>
            <SectionTitle>
              <PlaySquare size={14} className="text-red-600" />
              YouTube / Video
            </SectionTitle>
            <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
              <a
                href={problem.youtubeLinks}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-900 hover:text-gray-700 underline flex items-center gap-1 break-all"
              >
                <ExternalLink size={12} />
                {problem.youtubeLinks}
              </a>
              {/* Try to embed if it's a YouTube URL */}
              {(() => {
                const url = problem.youtubeLinks;
                const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
                if (videoId) {
                  return (
                    <div className="mt-3 aspect-video w-full max-w-md sm:max-w-none">
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId[1]}`}
                        title="SIH Problem Statement Video"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full rounded-lg border border-gray-200"
                      />
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </section>
        )}

        {/* Resources */}
        {problem.resourceLinks && (
          <section>
            <SectionTitle>
              <Link2 size={14} />
              Related Resources
            </SectionTitle>
            <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
              <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: problem.resourceLinks }} />
            </div>
          </section>
        )}

        {/* Application History Chart */}
        {showChart && (
          <section>
            <SectionTitle>
              <TrendingUp size={14} />
              Application History
            </SectionTitle>
            <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value: any) => [value?.toLocaleString() || "0", "Applications"]}
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "4px", fontSize: "12px" }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* History Table */}
        {problem.history.length > 0 && (
          <section>
            <SectionTitle>
              <Clock size={14} />
              History Log
            </SectionTitle>

            {/* Mobile: Card view */}
            <div className="sm:hidden space-y-3">
              {problem.history.slice(0, 20).map((h) => (
                <div key={h.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono text-gray-500">{formatDistanceToNow(new Date(h.timestamp), { addSuffix: true })}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Count</p>
                      <p className="text-sm font-mono text-gray-900">{h.applicationCount.toLocaleString()}</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Change</p>
                      <span className={clsx("text-sm font-medium", h.change > 0 ? "text-green-600" : h.change < 0 ? "text-red-600" : "text-gray-400")}>
                        {h.change > 0 ? "+" : ""}{h.change}
                      </span>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Source</p>
                      <p className="text-sm text-gray-500 capitalize">{h.source}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table view */}
            <div className="hidden sm:block bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Change</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {problem.history.slice(0, 20).map((h) => (
                    <tr key={h.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-600">
                        {formatDistanceToNow(new Date(h.timestamp), { addSuffix: true })}
                      </td>
                      <td className="px-3 py-2 text-sm font-mono font-medium text-gray-900">
                        {h.applicationCount.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-sm font-medium">
                        {h.change > 0 ? (
                          <span className="text-green-600">+{h.change}</span>
                        ) : h.change < 0 ? (
                          <span className="text-red-600">{h.change}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500 capitalize">{h.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Shortlist Notes */}
        <section>
          <SectionTitle>
            <FileText size={14} />
            Personal Notes
          </SectionTitle>
          <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
            {problem.shortlist ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Priority:</span>
                  <PriorityBadge priority={problem.shortlist.priority} />
                </div>
                <textarea
                  value={problem.shortlist.notes || ""}
                  onChange={(e) => handleShortlistUpdate(problem.shortlist?.priority || "Medium", e.target.value)}
                  className="w-full min-h-[100px] p-2 sm:p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  placeholder="Add your personal notes..."
                />
              </div>
            ) : (
              <button
                onClick={handleShortlistToggle}
                className="w-full py-3 text-sm text-gray-600 hover:text-gray-900 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400"
              >
                Add to shortlist to enable personal notes
              </button>
            )}
          </div>
        </section>

        {/* Metadata */}
        <section>
          <SectionTitle>
            <Globe size={14} />
            Metadata
          </SectionTitle>
          <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 space-y-2 text-sm">
            <InfoRow label="PS ID">{problem.psId}</InfoRow>
            <InfoRow label="Organization">{problem.organization}</InfoRow>
            <InfoRow label="Department">{problem.department || "—"}</InfoRow>
            <InfoRow label="Category"><span className="capitalize">{problem.category}</span></InfoRow>
            <InfoRow label="Theme">{problem.theme}</InfoRow>
            <InfoRow label="Type"><span className="capitalize">{problem.type}</span></InfoRow>
            <InfoRow label="Max Applications">{problem.maxApplications.toLocaleString()}</InfoRow>
            <InfoRow label="Source" href={problem.sourceUrl}>{problem.sourceUrl}</InfoRow>
            <InfoRow label="Created">{problem.createdAt ? formatDistanceToNow(new Date(problem.createdAt), { addSuffix: true }) : "—"}</InfoRow>
            <InfoRow label="Last Updated">{problem.updatedAt ? formatDistanceToNow(new Date(problem.updatedAt), { addSuffix: true }) : "—"}</InfoRow>
          </div>
        </section>
      </div>
    </div>
  );
}