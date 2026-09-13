import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { validateConfiguration, testConnection } from "@/lib/gemini/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const thresholds = await prisma.settings.findUnique({
      where: { key: "competition_thresholds" },
    });

    const geminiStatus = validateConfiguration();

    const lastSync = await prisma.syncLog.findFirst({
      orderBy: { timestamp: "desc" },
    });

    return NextResponse.json({
      competitionThresholds: thresholds
        ? JSON.parse(thresholds.value)
        : { low: 0, medium: 100, high: 250, veryHigh: 500 },
      gemini: {
        configured: geminiStatus.configured,
        message: geminiStatus.message,
      },
      lastSync: lastSync
        ? {
            status: lastSync.status,
            message: lastSync.message,
            timestamp: lastSync.timestamp,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.competitionThresholds) {
      const { low, medium, high, veryHigh } = body.competitionThresholds;
      if (
        typeof low !== "number" ||
        typeof medium !== "number" ||
        typeof high !== "number" ||
        typeof veryHigh !== "number"
      ) {
        return NextResponse.json(
          { error: "Invalid threshold values" },
          { status: 400 }
        );
      }

      await prisma.settings.upsert({
        where: { key: "competition_thresholds" },
        update: { value: JSON.stringify({ low, medium, high, veryHigh }) },
        create: {
          key: "competition_thresholds",
          value: JSON.stringify({ low, medium, high, veryHigh }),
        },
      });

      // Recalculate all competition levels (import the function)
      const { getCompetitionLevel } = await import("@/lib/competition");
      const allProblems = await prisma.problemStatement.findMany();
      const thresholds = { low, medium, high, veryHigh };

      for (const p of allProblems) {
        const newLevel = getCompetitionLevel(p.applicationCount, thresholds);
        if (newLevel !== p.competitionLevel) {
          await prisma.problemStatement.update({
            where: { id: p.id },
            data: { competitionLevel: newLevel },
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
