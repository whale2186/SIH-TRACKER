import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const problems = await prisma.problemStatement.findMany({
      select: {
        id: true,
        psId: true,
        applicationCount: true,
        category: true,
        theme: true,
        organization: true,
        competitionLevel: true,
      },
    });

    const counts = problems.map((p) => p.applicationCount);
    counts.sort((a, b) => a - b);

    const totalPS = problems.length;
    const totalApplications = counts.reduce((a, b) => a + b, 0);
    const averageApplications = totalPS > 0 ? Math.round(totalApplications / totalPS) : 0;
    const medianApplications =
      totalPS > 0
        ? totalPS % 2 === 0
          ? Math.round((counts[totalPS / 2 - 1] + counts[totalPS / 2]) / 2)
          : counts[Math.floor(totalPS / 2)]
        : 0;

    const sorted = [...problems].sort((a, b) => b.applicationCount - a.applicationCount);
    const highest = sorted[0];
    const lowest = sorted[sorted.length - 1];

    // By theme
    const themeMap = new Map<string, { count: number; total: number }>();
    for (const p of problems) {
      const t = p.theme || "Unknown";
      const existing = themeMap.get(t) || { count: 0, total: 0 };
      existing.count++;
      existing.total += p.applicationCount;
      themeMap.set(t, existing);
    }
    const byTheme = Array.from(themeMap.entries())
      .map(([theme, { count, total }]) => ({
        theme,
        count,
        avgApplications: Math.round(total / count),
      }))
      .sort((a, b) => b.count - a.count);

    // By organization
    const orgMap = new Map<string, { count: number; total: number }>();
    for (const p of problems) {
      const o = p.organization || "Unknown";
      const existing = orgMap.get(o) || { count: 0, total: 0 };
      existing.count++;
      existing.total += p.applicationCount;
      orgMap.set(o, existing);
    }
    const byOrganization = Array.from(orgMap.entries())
      .map(([organization, { count, total }]) => ({
        organization,
        count,
        avgApplications: Math.round(total / count),
      }))
      .sort((a, b) => b.count - a.count);

    // By category
    const catMap = new Map<string, number>();
    for (const p of problems) {
      const c = p.category || "Unknown";
      catMap.set(c, (catMap.get(c) || 0) + 1);
    }
    const byCategory = Array.from(catMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // Competition distribution
    const compMap = new Map<string, number>();
    for (const p of problems) {
      const c = p.competitionLevel || "Low";
      compMap.set(c, (compMap.get(c) || 0) + 1);
    }
    const competitionDistribution = Array.from(compMap.entries())
      .map(([level, count]) => ({ level, count }));

    // Application distribution
    const ranges = [
      { range: "0-49", min: 0, max: 49 },
      { range: "50-99", min: 50, max: 99 },
      { range: "100-199", min: 100, max: 199 },
      { range: "200-299", min: 200, max: 299 },
      { range: "300-399", min: 300, max: 399 },
      { range: "400-499", min: 400, max: 499 },
      { range: "500+", min: 500, max: Infinity },
    ];
    const applicationDistribution = ranges.map(({ range, min, max }) => ({
      range,
      count: counts.filter((c) => c >= min && c <= max).length,
    }));

    return NextResponse.json({
      totalPS,
      totalApplications,
      averageApplications,
      medianApplications,
      highestApplications: highest
        ? { psId: highest.psId, count: highest.applicationCount }
        : null,
      lowestApplications: lowest
        ? { psId: lowest.psId, count: lowest.applicationCount }
        : null,
      byTheme,
      byOrganization,
      byCategory,
      competitionDistribution,
      applicationDistribution,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
