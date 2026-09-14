import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCompetitionLevel } from "@/lib/competition";

export async function POST(request: Request) {
  try {
    // 1. Basic security - require an API key to prevent unauthorized updates
    const authHeader = request.headers.get("authorization");
    const expectedKey = process.env.SYNC_API_KEY;
    
    if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse the incoming JSON workload from the Go script
    const data = await request.json();
    const counts: { psId: string; count: number }[] = data.problems;

    if (!counts || !Array.isArray(counts) || counts.length === 0) {
      return NextResponse.json(
        { error: "Invalid payload. Expected { problems: [{psId, count}] }" },
        { status: 400 }
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
            source: "ingest_api",
          },
        });

        await prisma.problemStatement.update({
          where: { psId },
          data: {
            applicationCount: count,
            previousApplicationCount: existing.applicationCount,
            competitionLevel: getCompetitionLevel(count),
            updateSource: "ingest_api",
            lastCheckedAt: new Date(),
          },
        });

        updated++;
      } else if (existing) {
        // Just bump the lastChecked date so we know it's fresh
        await prisma.problemStatement.update({
          where: { psId },
          data: { lastCheckedAt: new Date() },
        });
      }
    }

    await prisma.syncLog.create({
      data: {
        status: "success",
        message: `Ingested ${counts.length} PSs, updated ${updated} application counts`,
        count: counts.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Ingested ${counts.length} PSs. ${updated} application counts updated.`,
      synced: counts.length,
      updated,
    });
  } catch (error) {
    console.error("Ingest error:", error);
    const msg = error instanceof Error ? error.message : "Ingest failed";

    await prisma.syncLog
      .create({
        data: { status: "error", message: msg, count: 0 },
      })
      .catch(() => {});

    return NextResponse.json({ error: `Ingest failed: ${msg}` }, { status: 500 });
  }
}