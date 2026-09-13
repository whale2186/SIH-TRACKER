import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const logs = await prisma.syncLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 50,
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching sync logs:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}