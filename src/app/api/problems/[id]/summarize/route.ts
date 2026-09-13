import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { summarizeProblemStatement, validateConfiguration } from "@/lib/gemini/service";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const config = validateConfiguration();
    if (!config.configured) {
      return NextResponse.json({ error: config.message }, { status: 400 });
    }

    const problem = await prisma.problemStatement.findUnique({ where: { id } });
    if (!problem) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const regenerate = searchParams.get("regenerate") === "true";

    // Check for cached summary
    if (!regenerate) {
      const existing = await prisma.geminiSummary.findUnique({
        where: { problemStatementId: id },
      });
      if (existing) {
        return NextResponse.json(existing);
      }
    }

    const summaryText = await summarizeProblemStatement({
      psId: problem.psId,
      title: problem.title,
      description: problem.description,
      organization: problem.organization,
      department: problem.department,
      category: problem.category,
      theme: problem.theme,
      applicationCount: problem.applicationCount,
      datasetUrl: problem.datasetUrl,
      youtubeLink: problem.youtubeLinks,
    });

    const summary = await prisma.geminiSummary.upsert({
      where: { problemStatementId: id },
      update: {
        summary: summaryText,
        model: "gemini-1.5-flash",
        generatedAt: new Date(),
      },
      create: {
        problemStatementId: id,
        summary: summaryText,
        model: "gemini-1.5-flash",
      },
    });

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error summarizing:", error);
    const msg = error instanceof Error ? error.message : "Summarization failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
