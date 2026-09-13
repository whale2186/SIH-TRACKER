import { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { ProblemDetailClient } from "@/components/problems/problem-detail-client";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const id = parseInt(params.id);
  if (isNaN(id)) return { title: "Not Found" };
  const problem = await prisma.problemStatement.findUnique({
    where: { id },
    select: { title: true, psId: true },
  });
  if (!problem) return { title: "Not Found" };
  return { title: `${problem.psId} - ${problem.title}` };
}

export default async function Page({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  if (isNaN(id)) notFound();

  const problem = await prisma.problemStatement.findUnique({
    where: { id },
    include: {
      shortlist: true,
      history: { orderBy: { timestamp: "desc" } },
      summary: true,
    },
  });

  if (!problem) notFound();

  // Convert Date fields to strings for client component
  const serializedProblem = {
    ...problem,
    lastCheckedAt: problem.lastCheckedAt?.toISOString() || null,
    createdAt: problem.createdAt?.toISOString() || null,
    updatedAt: problem.updatedAt?.toISOString() || null,
    history: problem.history.map((h) => ({
      ...h,
      timestamp: h.timestamp.toISOString(),
    })),
    shortlist: problem.shortlist
      ? {
          ...problem.shortlist,
          createdAt: problem.shortlist.createdAt.toISOString(),
          updatedAt: problem.shortlist.updatedAt.toISOString(),
        }
      : null,
    summary: problem.summary
      ? {
          ...problem.summary,
          generatedAt: problem.summary.generatedAt.toISOString(),
        }
      : null,
  };

  return <ProblemDetailClient problem={serializedProblem} />;
}