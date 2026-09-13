import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCompetitionLevel } from "@/lib/competition";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let records: Record<string, string | number>[] = [];

    if (contentType.includes("application/json")) {
      const body = await request.json();
      records = Array.isArray(body) ? body : body.data || [];
    } else {
      // CSV
      const text = await request.text();
      const lines = text.trim().split("\n");
      if (lines.length < 2) {
        return NextResponse.json({ error: "CSV must have header + data rows" }, { status: 400 });
      }

      const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].match(/(".*?"|[^,]+)/g) || [];
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = (values[idx] || "").replace(/^"|"$/g, "").trim();
        });
        records.push(row);
      }
    }

    if (records.length === 0) {
      return NextResponse.json({ error: "No records found" }, { status: 400 });
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const record of records) {
      const psId = String(record.ps_id || record.psId || "").trim();
      const title = String(record.title || "").trim();

      if (!psId) {
        skipped++;
        errors.push(`Skipped row: missing ps_id`);
        continue;
      }

      const appCount = parseInt(String(record.applications || record.applicationCount || record.application_count || "0"));

      const data = {
        title: title || psId,
        description: String(record.description || ""),
        descriptionHtml: String(record.description_html || record.descriptionHtml || ""),
        organization: String(record.organization || ""),
        department: String(record.department || ""),
        category: String(record.category || record.type || ""),
        theme: String(record.theme || ""),
        type: String(record.type || record.category || ""),
        sourceUrl: String(record.source_url || record.sourceUrl || ""),
        applicationCount: isNaN(appCount) ? 0 : appCount,
        maxApplications: parseInt(String(record.max_applications || record.maxApplications || "500")) || 500,
        competitionLevel: getCompetitionLevel(isNaN(appCount) ? 0 : appCount),
        datasetUrl: String(record.dataset_url || record.datasetUrl || record.dataset_link || ""),
        youtubeLinks: String(record.youtube_link || record.youtubeLinks || record.youtube_links || ""),
        updateSource: "import",
        lastCheckedAt: new Date(),
      };

      try {
        const existing = await prisma.problemStatement.findUnique({ where: { psId } });

        if (existing) {
          await prisma.problemStatement.update({ where: { psId }, data });
          if (existing.applicationCount !== data.applicationCount) {
            await prisma.applicationHistory.create({
              data: {
                problemStatementId: existing.id,
                applicationCount: data.applicationCount,
                previousCount: existing.applicationCount,
                change: data.applicationCount - existing.applicationCount,
                source: "import",
              },
            });
          }
          updated++;
        } else {
          const ps = await prisma.problemStatement.create({ data: { psId, ...data } });
          await prisma.applicationHistory.create({
            data: {
              problemStatementId: ps.id,
              applicationCount: data.applicationCount,
              previousCount: 0,
              change: data.applicationCount,
              source: "import",
            },
          });
          created++;
        }
      } catch (err) {
        skipped++;
        errors.push(`Error importing ${psId}: ${err instanceof Error ? err.message : "unknown"}`);
      }
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      skipped,
      errors: errors.slice(0, 10),
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
