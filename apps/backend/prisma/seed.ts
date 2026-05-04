import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const mountains = [
  {
    name: "Gunung Gede",
    location: "Cianjur, Jawa Barat",
    description:
      "Gunung berapi aktif dengan ketinggian 2.958 mdpl. Salah satu gunung paling populer di Jawa Barat.",
    latitude: -6.7839,
    longitude: 106.9776,
    checkpoints: [
      {
        orderNumber: 1,
        name: "Pos 1 Cibunar",
        latitude: -6.7901,
        longitude: 106.9812,
        radiusMeters: 50,
      },
      {
        orderNumber: 2,
        name: "Pos 2 Kandang Badak",
        latitude: -6.7855,
        longitude: 106.979,
        radiusMeters: 60,
      },
      {
        orderNumber: 3,
        name: "Pos 3 Puncak Gede",
        latitude: -6.7839,
        longitude: 106.9776,
        radiusMeters: 80,
      },
    ],
  },
  {
    name: "Gunung Prau",
    location: "Dieng, Jawa Tengah",
    description:
      "Gunung dengan ketinggian 2.565 mdpl terkenal dengan golden sunrise dan hamparan bunga daisy.",
    latitude: -7.1878,
    longitude: 109.9176,
    checkpoints: [
      {
        orderNumber: 1,
        name: "Pos 1 Patak Banteng",
        latitude: -7.192,
        longitude: 109.914,
        radiusMeters: 50,
      },
      {
        orderNumber: 2,
        name: "Pos 2 Cacingan",
        latitude: -7.19,
        longitude: 109.916,
        radiusMeters: 50,
      },
      {
        orderNumber: 3,
        name: "Pos 3 Puncak Prau",
        latitude: -7.1878,
        longitude: 109.9176,
        radiusMeters: 80,
      },
    ],
  },
  {
    name: "Gunung Rinjani",
    location: "Lombok, Nusa Tenggara Barat",
    description:
      "Gunung berapi aktif tertinggi kedua di Indonesia dengan ketinggian 3.726 mdpl.",
    latitude: -8.4167,
    longitude: 116.4667,
    checkpoints: [
      {
        orderNumber: 1,
        name: "Pos 1 Sembalun Lawang",
        latitude: -8.39,
        longitude: 116.48,
        radiusMeters: 60,
      },
      {
        orderNumber: 2,
        name: "Pos 2 Tengengean",
        latitude: -8.4,
        longitude: 116.475,
        radiusMeters: 50,
      },
      {
        orderNumber: 3,
        name: "Pos 3 Pelawangan Sembalun",
        latitude: -8.41,
        longitude: 116.47,
        radiusMeters: 70,
      },
      {
        orderNumber: 4,
        name: "Pos 4 Puncak Rinjani",
        latitude: -8.4167,
        longitude: 116.4667,
        radiusMeters: 100,
      },
    ],
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  for (const { checkpoints, ...mountainData } of mountains) {
    const existing = await prisma.mountain.findFirst({
      where: { name: mountainData.name },
    });

    if (existing) {
      console.log(`⏭️  Skipping ${mountainData.name} (already exists)`);
      continue;
    }

    const mountain = await prisma.mountain.create({
      data: {
        ...mountainData,
        totalCheckpoints: checkpoints.length,
        checkpoints: { createMany: { data: checkpoints } },
      },
    });

    console.log(
      `✅ Seeded: ${mountain.name} (${checkpoints.length} checkpoints)`,
    );
  }

  console.log("\n🏔️  Seeding complete!");
}

main()
  .catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
