import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCompetitionLevel } from "@/lib/competition";

export async function POST() {
  try {
    // Try to fetch from SIH website
    const response = await fetch("https://www.sih.gov.in/sih2026PS", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      let errorMessage = `SIH website returned status ${response.status}`;
      if (response.status === 403) {
        errorMessage = "SIH website blocked this request (403 Forbidden). This typically happens when hosted on cloud platforms (Vercel, Render, etc.) as the SIH website blocks known cloud IP ranges. Sync works locally but not from cloud hosts.";
      } else if (response.status === 405) {
        errorMessage = "SIH website returned 405 Method Not Allowed. The page may require a different access method.";
      }
      
      await prisma.syncLog.create({
        data: {
          status: "error",
          message: errorMessage,
          count: 0,
        },
      });
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status === 403 ? 403 : 502 }
      );
    }

    const html = await response.text();

    // Parse application counts from HTML
    // Each row has: PS ID and count/500
    const psCountRegex =
      /<td>(SIH\d+)<\/td>\s*<td>(\d+)\/500<\/td>/g;
    const counts: { psId: string; count: number }[] = [];
    let match;
    while ((match = psCountRegex.exec(html)) !== null) {
      counts.push({ psId: match[1], count: parseInt(match[2]) });
    }

    if (counts.length === 0) {
      await prisma.syncLog.create({
        data: {
          status: "error",
          message: "Could not parse any PS data from SIH website",
          count: 0,
        },
      });
      return NextResponse.json(
        { error: "Could not parse PS data from SIH website. The page structure may have changed." },
        { status: 502 }
      );
    }

    // Validate: don't nuke everything if we get too few results
    const existingCount = await prisma.problemStatement.count();
    if (existingCount > 10 && counts.length < existingCount * 0.5) {
      await prisma.syncLog.create({
        data: {
          status: "error",
          message: `Validation failed: got ${counts.length} PSs but have ${existingCount}`,
          count: counts.length,
        },
      });
      return NextResponse.json(
        {
          error: `Data validation failed. Expected ~${existingCount} PSs but only got ${counts.length}. Keeping existing data.`,
        },
        { status: 502 }
      );
    }

    let updated = 0;
    for (const { psId, count } of counts) {
      const existing = await prisma.problemStatement.findUnique({
        where: { psId },
      });

      if (existing && existing.applicationCount !== count) {
        await prisma.applicationHistory.create({
          data: {
            problemStatementId: existing.id,
            applicationCount: count,
            previousCount: existing.applicationCount,
            change: count - existing.applicationCount,
            source: "sih_sync",
          },
        });

        await prisma.problemStatement.update({
          where: { psId },
          data: {
            applicationCount: count,
            previousApplicationCount: existing.applicationCount,
            competitionLevel: getCompetitionLevel(count),
            updateSource: "sih_sync",
            lastCheckedAt: new Date(),
          },
        });

        updated++;
      } else if (existing) {
        await prisma.problemStatement.update({
          where: { psId },
          data: { lastCheckedAt: new Date() },
        });
      }
    }

    await prisma.syncLog.create({
      data: {
        status: "success",
        message: `Synced ${counts.length} PSs, updated ${updated} application counts`,
        count: counts.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Synced ${counts.length} PSs. ${updated} application counts updated.`,
      synced: counts.length,
      updated,
    });
  } catch (error) {
    console.error("Sync error:", error);
    const msg = error instanceof Error ? error.message : "Sync failed";

    await prisma.syncLog
      .create({
        data: { status: "error", message: msg, count: 0 },
      })
      .catch(() => {});

    return NextResponse.json({ error: `Sync failed: ${msg}` }, { status: 500 });
  }
}
