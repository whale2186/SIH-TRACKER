import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCompetitionLevel } from "@/lib/competition";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const newCount = parseInt(body.applicationCount);
    const source = body.source || "manual";

    if (isNaN(newCount) || newCount < 0) {
      return NextResponse.json({ error: "Invalid application count" }, { status: 400 });
    }

    const existing = await prisma.problemStatement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Record history
    await prisma.applicationHistory.create({
      data: {
        problemStatementId: id,
        applicationCount: newCount,
        previousCount: existing.applicationCount,
        change: newCount - existing.applicationCount,
        source,
      },
    });

    // Update the problem statement
    const updated = await prisma.problemStatement.update({
      where: { id },
      data: {
        applicationCount: newCount,
        previousApplicationCount: existing.applicationCount,
        competitionLevel: getCompetitionLevel(newCount),
        updateSource: source,
        lastCheckedAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating application count:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
