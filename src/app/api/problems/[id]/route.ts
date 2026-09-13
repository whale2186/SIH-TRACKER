import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCompetitionLevel } from "@/lib/competition";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const problem = await prisma.problemStatement.findUnique({
      where: { id },
      include: {
        shortlist: true,
        history: { orderBy: { timestamp: "desc" } },
        summary: true,
      },
    });

    if (!problem) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(problem);
  } catch (error) {
    console.error("Error fetching problem:", error);
    return NextResponse.json({ error: "Failed to fetch problem" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();

    // If application count is being updated, record history
    if (body.applicationCount !== undefined) {
      const existing = await prisma.problemStatement.findUnique({ where: { id } });
      if (existing && existing.applicationCount !== body.applicationCount) {
        await prisma.applicationHistory.create({
          data: {
            problemStatementId: id,
            applicationCount: body.applicationCount,
            previousCount: existing.applicationCount,
            change: body.applicationCount - existing.applicationCount,
            source: body.updateSource || "manual",
          },
        });
        body.previousApplicationCount = existing.applicationCount;
        body.competitionLevel = getCompetitionLevel(body.applicationCount);
        body.lastCheckedAt = new Date();
      }
    }

    const updated = await prisma.problemStatement.update({
      where: { id },
      data: body,
      include: { shortlist: true, history: { orderBy: { timestamp: "desc" }, take: 10 } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating problem:", error);
    return NextResponse.json({ error: "Failed to update problem" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await prisma.problemStatement.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting problem:", error);
    return NextResponse.json({ error: "Failed to delete problem" }, { status: 500 });
  }
}
