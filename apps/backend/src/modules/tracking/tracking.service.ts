import { TrackingRepository } from "./tracking.repository";
import {
  isWithinCheckpoint,
  isOutOfRange,
  haversineDistance,
} from "../../shared/utils/geo.utils";
import { broadcastToSession } from "../../shared/lib/socket";
import { sendPushNotification } from "../../shared/lib/firebase";
import type { LocationBatchDto } from "./tracking.schema";

const makeError = (msg: string, code: string, status: number) => {
  const err = new Error(msg) as Error & { code: string; statusCode: number };
  err.code = code;
  err.statusCode = status;
  return err;
};

export const TrackingService = {
  async uploadLocations(
    sessionId: string,
    userId: string,
    dto: LocationBatchDto,
  ) {
    const sessionInfo = await TrackingRepository.findSessionInfo(sessionId);
    if (!sessionInfo) throw makeError("Session not found", "NOT_FOUND", 404);
    if (sessionInfo.status !== "ONGOING")
      throw makeError("Session is not active", "SESSION_NOT_ACTIVE", 400);

    // 1. Persist semua location points
    await TrackingRepository.insertLocationBatch(
      sessionId,
      userId,
      dto.locations,
    );

    // 2. Checkpoint detection — evaluasi dari lokasi terakhir di batch
    const lastLoc = dto.locations[dto.locations.length - 1];
    const [nextCheckpoint] = await TrackingRepository.findNextCheckpoint(
      sessionId,
      userId,
      sessionInfo.mountainId,
    );

    let checkpointTriggered = null;

    if (
      nextCheckpoint &&
      isWithinCheckpoint(lastLoc.latitude, lastLoc.longitude, {
        latitude: nextCheckpoint.latitude,
        longitude: nextCheckpoint.longitude,
        radiusMeters: nextCheckpoint.radius_meters,
      })
    ) {
      const lastCp = await TrackingRepository.findLastCheckpointTime(
        sessionId,
        userId,
      );
      const from = lastCp?.arrivedAt ?? sessionInfo.startedAt;
      const elapsedSeconds = Math.floor(
        (new Date(lastLoc.recorded_at).getTime() - new Date(from).getTime()) /
          1000,
      );

      await TrackingRepository.recordCheckpoint({
        sessionId,
        userId,
        checkpointId: nextCheckpoint.id,
        orderNumber: nextCheckpoint.order_number,
        arrivedAt: new Date(lastLoc.recorded_at),
        elapsedSeconds,
      });

      checkpointTriggered = {
        checkpoint_id: nextCheckpoint.id,
        name: nextCheckpoint.name,
        order_number: nextCheckpoint.order_number,
        arrived_at: lastLoc.recorded_at,
        elapsed_seconds: elapsedSeconds,
      };

      broadcastToSession(sessionId, "checkpoint:reached", {
        user_id: userId,
        ...checkpointTriggered,
      });
    }

    // 3. Out-of-range detection
    const allLocations =
      await TrackingRepository.findAllLatestLocations(sessionId);
    const userLoc = allLocations.find((l) => l.user_id === userId);

    if (userLoc) {
      for (const other of allLocations) {
        if (other.user_id === userId) continue;
        if (
          isOutOfRange(
            userLoc.latitude,
            userLoc.longitude,
            other.latitude,
            other.longitude,
          )
        ) {
          const distanceMeters = Math.round(
            haversineDistance(
              userLoc.latitude,
              userLoc.longitude,
              other.latitude,
              other.longitude,
            ),
          );

          broadcastToSession(sessionId, "member:out_of_range", {
            user_id: userId,
            name: userLoc.name,
            distance_meters: distanceMeters,
            safe_distance_meters: Number(
              process.env.DEFAULT_SAFE_DISTANCE_METERS ?? 200,
            ),
          });

          if (userLoc.fcm_token) {
            await sendPushNotification(
              userLoc.fcm_token,
              "⚠️ Out of range",
              "You are too far from your group",
              { session_id: sessionId },
            );
          }
          break;
        }
      }
    }

    return {
      synced_count: dto.locations.length,
      checkpoint_triggered: checkpointTriggered,
    };
  },

  async getLatestLocations(sessionId: string) {
    return TrackingRepository.findLatestLocationsBySession(sessionId);
  },
};
