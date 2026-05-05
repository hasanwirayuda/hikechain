import { prisma } from "../../shared/lib/prisma";

export const MountainRepository = {
  findAll: () =>
    prisma.mountain.findMany({
      select: {
        id: true,
        name: true,
        location: true,
        description: true,
        latitude: true,
        longitude: true,
        totalCheckpoints: true,
      },
      orderBy: { name: "asc" },
    }),

  findById: (id: string) =>
    prisma.mountain.findUnique({
      where: { id },
      include: {
        checkpoints: {
          orderBy: { orderNumber: "asc" },
          select: {
            id: true,
            orderNumber: true,
            name: true,
            latitude: true,
            longitude: true,
            radiusMeters: true,
          },
        },
      },
    }),
};
