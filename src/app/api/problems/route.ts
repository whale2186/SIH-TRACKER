import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCompetitionLevel, DEFAULT_THRESHOLDS } from "@/lib/competition";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const theme = searchParams.get("theme") || "";
    const organization = searchParams.get("organization") || "";
    const competition = searchParams.get("competition") || "";
    const shortlisted = searchParams.get("shortlisted") || "";
    const sortBy = searchParams.get("sortBy") || "applicationCount";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Prisma.ProblemStatementWhereInput = {};
    const conditions: Prisma.ProblemStatementWhereInput[] = [];

    if (search) {
      conditions.push({
        OR: [
          { psId: { contains: search } },
          { title: { contains: search } },
          { description: { contains: search } },
          { organization: { contains: search } },
          { department: { contains: search } },
          { theme: { contains: search } },
        ],
      });
    }

    if (category) conditions.push({ category });
    if (theme) conditions.push({ theme });
    if (organization) conditions.push({ organization });
    if (competition) conditions.push({ competitionLevel: competition });

    if (shortlisted === "yes") {
      conditions.push({ shortlist: { isNot: null } });
    } else if (shortlisted === "no") {
      conditions.push({ shortlist: null });
    }

    if (conditions.length > 0) {
      where.AND = conditions;
    }

    const orderBy: Prisma.ProblemStatementOrderByWithRelationInput = {};
    const validSortFields = ["applicationCount", "title", "psId", "organization", "updatedAt", "createdAt", "competitionLevel"];
    if (validSortFields.includes(sortBy)) {
      (orderBy as Record<string, string>)[sortBy] = sortOrder;
    } else {
      orderBy.applicationCount = "desc";
    }

    const [problems, total] = await Promise.all([
      prisma.problemStatement.findMany({
        where,
        include: {
          shortlist: true,
          history: {
            orderBy: { timestamp: "desc" },
            take: 10,
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.problemStatement.count({ where }),
    ]);

    return NextResponse.json({
      data: problems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching problems:", error);
    return NextResponse.json({ error: "Failed to fetch problems" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.psId || !body.title) {
      return NextResponse.json({ error: "psId and title are required" }, { status: 400 });
    }

    const existing = await prisma.problemStatement.findUnique({
      where: { psId: body.psId },
    });

    if (existing) {
      return NextResponse.json({ error: "Problem statement already exists" }, { status: 409 });
    }

    const competitionLevel = getCompetitionLevel(body.applicationCount || 0);

    const problem = await prisma.problemStatement.create({
      data: {
        psId: body.psId,
        title: body.title,
        description: body.description || "",
        descriptionHtml: body.descriptionHtml || "",
        organization: body.organization || "",
        department: body.department || "",
        category: body.category || "",
        theme: body.theme || "",
        type: body.category || "",
        sourceUrl: body.sourceUrl || "",
        applicationCount: body.applicationCount || 0,
        maxApplications: body.maxApplications || 500,
        competitionLevel,
        datasetUrl: body.datasetUrl || "",
        youtubeLinks: body.youtubeLinks || "",
        resourceLinks: body.resourceLinks || "",
        updateSource: body.updateSource || "manual",
        lastCheckedAt: new Date(),
      },
    });

    // Create initial history
    await prisma.applicationHistory.create({
      data: {
        problemStatementId: problem.id,
        applicationCount: problem.applicationCount,
        previousCount: 0,
        change: problem.applicationCount,
        source: "manual",
      },
    });

    return NextResponse.json(problem, { status: 201 });
  } catch (error) {
    console.error("Error creating problem:", error);
    return NextResponse.json({ error: "Failed to create problem" }, { status: 500 });
  }
}
