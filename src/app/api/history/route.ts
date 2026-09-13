import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const history = await prisma.applicationHistory.findMany({
      include: {
        problemStatement: {
          select: { psId: true, title: true },
        },
      },
      orderBy: { timestamp: "desc" },
      take: 500,
    });
    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}