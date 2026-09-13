import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface SeedData {
  sno: number;
  ps_id: string;
  numeric_id: string;
  title: string;
  description: string;
  description_html: string;
  organization: string;
  department: string;
  category: string;
  theme: string;
  application_count: number;
  max_applications: number;
  youtube_link: string;
  dataset_link: string;
  source_url: string;
}

function getCompetitionLevel(count: number): string {
  if (count >= 500) return 'Very High';
  if (count >= 250) return 'High';
  if (count >= 100) return 'Medium';
  return 'Low';
}

async function main() {
  console.log('Seeding database...');

  const dataPath = path.join(__dirname, 'seed-data.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const data: SeedData[] = JSON.parse(rawData);

  console.log(`Found ${data.length} problem statements to import.`);

  // Set default thresholds
  await prisma.settings.upsert({
    where: { key: 'competition_thresholds' },
    update: {},
    create: {
      key: 'competition_thresholds',
      value: JSON.stringify({ low: 0, medium: 100, high: 250, veryHigh: 500 }),
    },
  });

  let created = 0;
  let updated = 0;

  for (const item of data) {
    if (!item.ps_id) continue;

    const existing = await prisma.problemStatement.findUnique({
      where: { psId: item.ps_id },
    });

    const psData = {
      title: item.title || '',
      description: item.description || '',
      descriptionHtml: item.description_html || '',
      organization: item.organization || '',
      department: item.department || '',
      category: item.category || '',
      theme: item.theme || '',
      type: item.category || '',
      sourceUrl: item.source_url || 'https://www.sih.gov.in/sih2026PS',
      applicationCount: item.application_count || 0,
      previousApplicationCount: existing?.applicationCount || 0,
      maxApplications: item.max_applications || 500,
      competitionLevel: getCompetitionLevel(item.application_count || 0),
      datasetUrl: item.dataset_link || '',
      youtubeLinks: item.youtube_link || '',
      updateSource: 'sih_import',
      lastCheckedAt: new Date(),
    };

    if (existing) {
      await prisma.problemStatement.update({
        where: { psId: item.ps_id },
        data: psData,
      });

      // Record history if count changed
      if (existing.applicationCount !== item.application_count) {
        await prisma.applicationHistory.create({
          data: {
            problemStatementId: existing.id,
            applicationCount: item.application_count || 0,
            previousCount: existing.applicationCount,
            change: (item.application_count || 0) - existing.applicationCount,
            source: 'sih_import',
          },
        });
      }
      updated++;
    } else {
      const created_ps = await prisma.problemStatement.create({
        data: {
          psId: item.ps_id,
          ...psData,
        },
      });

      // Create initial history entry
      await prisma.applicationHistory.create({
        data: {
          problemStatementId: created_ps.id,
          applicationCount: item.application_count || 0,
          previousCount: 0,
          change: item.application_count || 0,
          source: 'sih_import',
        },
      });
      created++;
    }
  }

  // Log sync
  await prisma.syncLog.create({
    data: {
      status: 'success',
      message: `Seeded ${created} new, updated ${updated} existing problem statements`,
      count: data.length,
    },
  });

  console.log(`Done! Created: ${created}, Updated: ${updated}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });