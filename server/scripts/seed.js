/**
 * Seed script — populates the database with realistic test data
 * for development. Run once with:
 *
 *   node scripts/seed.js
 *
 * Safe to run multiple times — it clears existing data first.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ── Helpers ────────────────────────────────────────────────────

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Delhi bounding box — latitude 28.40–28.88, longitude 76.84–77.35
function randomDelhiLat() { return randomBetween(28.50, 28.75); }
function randomDelhiLng() { return randomBetween(76.95, 77.30); }

const CATEGORIES = ['WATER', 'ELECTRICITY', 'ROAD', 'SAFETY', 'SANITATION'];

const TITLES = {
  WATER: [
    'Water pipeline burst on main road',
    'No water supply for 3 days',
    'Sewage mixing with drinking water',
    'Overflowing water tank near park',
    'Leaking fire hydrant flooding sidewalk',
  ],
  ELECTRICITY: [
    'Street light not working since a week',
    'Exposed electrical wires near school',
    'Frequent power cuts in Block B',
    'Transformer sparking dangerously',
    'No electricity in community hall',
  ],
  ROAD: [
    'Large pothole causing accidents',
    'Road completely waterlogged after rain',
    'Missing manhole cover on main street',
    'Speed breaker has collapsed',
    'Broken road divider near market',
  ],
  SAFETY: [
    'No CCTV cameras in dark alley',
    'Stray dog menace near school',
    'Abandoned construction site unsecured',
    'Broken boundary wall of park',
    'Missing traffic signal at busy crossing',
  ],
  SANITATION: [
    'Garbage dump not cleared for a week',
    'Overflowing dustbin near hospital',
    'Open drain causing mosquito breeding',
    'Public toilet in terrible condition',
    'Construction debris blocking footpath',
  ],
};

const DESCRIPTIONS = [
  'This has been a persistent issue affecting daily commuters and residents. Multiple complaints have been filed but no action taken yet.',
  'Residents of the colony have been suffering due to this problem. Immediate attention is required from the municipal corporation.',
  'This poses a serious safety risk especially for children and elderly. Needs urgent resolution.',
  'The issue gets worse during rainy season. Temporary fixes haven\'t worked. A permanent solution is needed.',
  'Several people have reported this independently. The condition has deteriorated significantly over the past month.',
];

const STATUSES = ['REPORTED', 'REPORTED', 'REPORTED', 'TRIAGED', 'TRIAGED', 'IN_PROGRESS', 'RESOLVED'];

async function main() {
  console.log('🌱 Seeding database...\n');

  // ── Clear existing data (order matters for FK constraints) ──
  await prisma.notification.deleteMany();
  await prisma.timelineEvent.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.confirmation.deleteMany();
  await prisma.report.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.user.deleteMany();
  console.log('  ✓ Cleared existing data');

  // ── Create test users ──────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Aarav Sharma',
        email: 'aarav@test.com',
        passwordHash,
        role: 'CITIZEN',
        trustScore: 15,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Priya Patel',
        email: 'priya@test.com',
        passwordHash,
        role: 'CITIZEN',
        trustScore: 22,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Rahul Verma',
        email: 'rahul@test.com',
        passwordHash,
        role: 'MODERATOR',
        trustScore: 45,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@test.com',
        passwordHash,
        role: 'ADMIN',
        trustScore: 100,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Neha Gupta',
        email: 'neha@test.com',
        passwordHash,
        role: 'CITIZEN',
        trustScore: 8,
      },
    }),
  ]);

  console.log(`  ✓ Created ${users.length} test users`);

  // ── Create incidents with reports ──────────────────────────

  let incidentCount = 0;

  for (let i = 0; i < 25; i++) {
    const category = pick(CATEGORIES);
    const title    = pick(TITLES[category]);
    const lat      = randomDelhiLat();
    const lng      = randomDelhiLng();
    const status   = pick(STATUSES);
    const reporter = pick(users.filter(u => u.role === 'CITIZEN'));
    const credScore = Math.floor(randomBetween(0, 50));
    const sevScore  = Math.floor(randomBetween(1, 5));
    const desc      = pick(DESCRIPTIONS);

    // Must use raw SQL because Prisma can't set Unsupported("geography") columns
    const [incident] = await prisma.$queryRawUnsafe(
      `INSERT INTO "Incident" (id, title, description, category, status, location, "credibilityScore", "severityScore", "createdById", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4::\"IncidentStatus\",
               ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography,
               $7, $8, $9, NOW())
       RETURNING id`,
      title, desc, category, status, lng, lat, credScore, sevScore, reporter.id,
    );

    // Create the primary report
    await prisma.report.create({
      data: {
        incidentId:   incident.id,
        reportedById: reporter.id,
        description:  pick(DESCRIPTIONS),
        lat,
        lng,
        photoUrls:    [],
      },
    });

    // Sometimes add a second confirmation report from a different user
    if (Math.random() > 0.5) {
      const confirmer = pick(users.filter(u => u.id !== reporter.id && u.role === 'CITIZEN'));
      if (confirmer) {
        const offsetLat = lat + randomBetween(-0.002, 0.002);
        const offsetLng = lng + randomBetween(-0.002, 0.002);
        await prisma.report.create({
          data: {
            incidentId:   incident.id,
            reportedById: confirmer.id,
            description:  'I can confirm this issue. Seen it first-hand today.',
            lat:          offsetLat,
            lng:          offsetLng,
            photoUrls:    [],
          },
        });
      }
    }

    incidentCount++;
  }

  console.log(`  ✓ Created ${incidentCount} incidents with reports`);

  // ── Summary ────────────────────────────────────────────────

  const totalIncidents = await prisma.incident.count();
  const totalReports   = await prisma.report.count();
  const totalUsers     = await prisma.user.count();

  console.log(`\n✅ Seed complete!`);
  console.log(`   ${totalUsers} users, ${totalIncidents} incidents, ${totalReports} reports`);
  console.log(`\n   Test login credentials:`);
  console.log(`   Citizen:   aarav@test.com / password123`);
  console.log(`   Moderator: rahul@test.com / password123`);
  console.log(`   Admin:     admin@test.com / password123\n`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
