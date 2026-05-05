import { prisma } from "../../shared/lib/prisma";
import type { LocationBatchDto } from "./tracking.schema";

export const TrackingRepository = {
  insertLocationBatch: (
    sessionId: string,
    userId: string,
    locations: LocationBatchDto["locations"],
  ) =>
    prisma.locationLog.createMany({
      data: locations.map((l) => ({
        sessionId,
        userId,
        latitude: l.latitude,
        longitude: l.longitude,
        accuracyMeters: l.accuracy_meters,
        recordedAt: new Date(l.recorded_at),
        isSynced: true,
      })),
    }),

  findNextCheckpoint: (sessionId: string, userId: string, mountainId: string) =>
    prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        order_number: number;
        latitude: number;
        longitude: number;
        radius_meters: number;
      }>
    >`
      SELECT c.id, c.name, c.order_number, c.latitude, c.longitude, c.radius_meters
      FROM checkpoints c
      WHERE c.mountain_id = ${mountainId}
        AND c.order_number > (
          SELECT COALESCE(MAX(cr.order_number), 0)
          FROM checkpoint_records cr
          WHERE cr.session_id = ${sessionId} AND cr.user_id = ${userId}
        )
      ORDER BY c.order_number
      LIMIT 1
    `,

  recordCheckpoint: (data: {
    sessionId: string;
    userId: string;
    checkpointId: string;
    orderNumber: number;
    arrivedAt: Date;
    elapsedSeconds: number;
  }) =>
    prisma.$transaction([
      prisma.checkpointRecord.create({ data }),
      prisma.sessionMember.updateMany({
        where: { sessionId: data.sessionId, userId: data.userId },
        data: {
          checkpointsCompleted: { increment: 1 },
          totalTimeSeconds: data.elapsedSeconds,
        },
      }),
    ]),

  findLastCheckpointTime: (sessionId: string, userId: string) =>
    prisma.checkpointRecord.findFirst({
      where: { sessionId, userId },
      orderBy: { orderNumber: "desc" },
      select: { arrivedAt: true },
    }),

  findSessionInfo: (sessionId: string) =>
    prisma.hikingSession.findUnique({
      where: { id: sessionId },
      select: {
        startedAt: true,
        mountainId: true,
        groupId: true,
        status: true,
      },
    }),

  findAllLatestLocations: (sessionId: string) =>
    prisma.$queryRaw<
      Array<{
        user_id: string;
        name: string;
        fcm_token: string | null;
        latitude: number;
        longitude: number;
      }>
    >`
      SELECT DISTINCT ON (l.user_id)
        l.user_id, u.name, u.fcm_token, l.latitude, l.longitude
      FROM location_logs l
      JOIN users u ON u.id = l.user_id
      WHERE l.session_id = ${sessionId}
      ORDER BY l.user_id, l.recorded_at DESC
    `,

  findLatestLocationsBySession: (sessionId: string) =>
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
