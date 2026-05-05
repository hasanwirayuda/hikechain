import { prisma } from "../../shared/lib/prisma";

const sessionWithRelations = {
  mountain: { select: { id: true, name: true, totalCheckpoints: true } },
  members: {
    select: {
      checkpointsCompleted: true,
      totalTimeSeconds: true,
      joinedAt: true,
      user: { select: { id: true, name: true } },
    },
  },
};

export const SessionRepository = {
  findById: (id: string) =>
    prisma.hikingSession.findUnique({
      where: { id },
      include: sessionWithRelations,
    }),

  create: (groupId: string, mountainId: string, memberIds: string[]) =>
    prisma.hikingSession.create({
      data: {
        groupId,
        mountainId,
        members: {
          createMany: { data: memberIds.map((userId) => ({ userId })) },
        },
      },
      include: sessionWithRelations,
    }),

  end: (id: string, totalDurationSeconds: number) =>
    prisma.hikingSession.update({
      where: { id },
      data: { status: "COMPLETED", endedAt: new Date(), totalDurationSeconds },
      include: sessionWithRelations,
    }),

  findSummary: (id: string) =>
    prisma.hikingSession.findUnique({
      where: { id },
      include: {
        mountain: { select: { name: true } },
        members: {
          include: { user: { select: { id: true, name: true } } },
        },
        checkpointRecords: {
          orderBy: [{ userId: "asc" }, { orderNumber: "asc" }],
          include: {
            checkpoint: { select: { name: true, orderNumber: true } },
          },
        },
      },
    }),

  findLatestLocations: (sessionId: string) =>
    prisma.$queryRaw<
      Array<{
        user_id: string;
        name: string;
        latitude: number;
        longitude: number;
        accuracy_meters: number;
        recorded_at: Date;
      }>
    >`
      SELECT DISTINCT ON (l.user_id)
        l.user_id, u.name, l.latitude, l.longitude,
        l.accuracy_meters, l.recorded_at
      FROM location_logs l
      JOIN users u ON u.id = l.user_id
      WHERE l.session_id = ${sessionId}
      ORDER BY l.user_id, l.recorded_at DESC
    `,
};
