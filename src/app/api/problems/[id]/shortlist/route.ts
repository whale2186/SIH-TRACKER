import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// Shortlist toggle
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const problem = await prisma.problemStatement.findUnique({ where: { id } });
    if (!problem) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const existing = await prisma.shortlist.findUnique({
      where: { problemStatementId: id },
    });

    if (existing) {
      await prisma.shortlist.delete({ where: { id: existing.id } });
      return NextResponse.json({ shortlisted: false });
    }

    const body = await request.json().catch(() => ({}));

    const shortlist = await prisma.shortlist.create({
      data: {
        problemStatementId: id,
        priority: body.priority || "Medium",
        notes: body.notes || "",
      },
    });

    return NextResponse.json({ shortlisted: true, shortlist });
  } catch (error) {
    console.error("Error toggling shortlist:", error);
    return NextResponse.json({ error: "Failed to update shortlist" }, { status: 500 });
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

    const existing = await prisma.shortlist.findUnique({
      where: { problemStatementId: id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not shortlisted" }, { status: 404 });
    }

    const updated = await prisma.shortlist.update({
      where: { id: existing.id },
      data: {
        priority: body.priority ?? existing.priority,
        notes: body.notes ?? existing.notes,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating shortlist:", error);
    return NextResponse.json({ error: "Failed to update shortlist" }, { status: 500 });
  }
}
