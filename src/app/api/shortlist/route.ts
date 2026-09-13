import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await prisma.shortlist.findMany({
      include: {
        problemStatement: {
          select: {
            id: true,
            psId: true,
            title: true,
            applicationCount: true,
            competitionLevel: true,
            organization: true,
            category: true,
            theme: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching shortlist:", error);
    return NextResponse.json({ error: "Failed to fetch shortlist" }, { status: 500 });
  }
}