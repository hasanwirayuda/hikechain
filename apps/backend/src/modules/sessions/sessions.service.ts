import { SessionRepository } from "./sessions.repository";
import { GroupRepository } from "../groups/groups.repository";
import { broadcastToSession } from "../../shared/lib/socket";

const makeError = (msg: string, code: string, status: number) => {
  const err = new Error(msg) as Error & { code: string; statusCode: number };
  err.code = code;
  err.statusCode = status;
  return err;
};

export const SessionsService = {
  async start(userId: string, groupId: string) {
    const group = await GroupRepository.findById(groupId);
    if (!group) throw makeError("Group not found", "NOT_FOUND", 404);
    if (group.leader.id !== userId)
      throw makeError(
        "Only the leader can start the session",
        "FORBIDDEN",
        403,
      );
    if (group.status !== "WAITING")
      throw makeError(
        "Group already has an active session",
        "SESSION_ALREADY_ACTIVE",
        400,
      );

    const memberIds = group.members.map((m) => m.user.id);
    const session = await SessionRepository.create(
      groupId,
      group.mountain.id,
      memberIds,
    );

    await GroupRepository.updateStatus(groupId, "HIKING");

    broadcastToSession(session.id, "session:started", {
      session_id: session.id,
      started_at: session.startedAt,
    });

    return session;
  },

  async getById(sessionId: string) {
    const session = await SessionRepository.findById(sessionId);
    if (!session) throw makeError("Session not found", "NOT_FOUND", 404);

    const locations = await SessionRepository.findLatestLocations(sessionId);

    const members = session.members.map((m) => ({
      user_id: m.user.id,
      name: m.user.name,
      checkpoints_completed: m.checkpointsCompleted,
      last_location: locations.find((l) => l.user_id === m.user.id) ?? null,
    }));

    return { ...session, members };
  },

  async end(sessionId: string, userId: string) {
    const session = await SessionRepository.findById(sessionId);
    if (!session) throw makeError("Session not found", "NOT_FOUND", 404);
    if (session.status !== "ONGOING")
      throw makeError("Session is not ongoing", "SESSION_NOT_ACTIVE", 400);

    const group = await GroupRepository.findById(session.groupId);
    if (!group || group.leader.id !== userId)
      throw makeError("Only the leader can end the session", "FORBIDDEN", 403);

    const totalDuration = Math.floor(
      (Date.now() - new Date(session.startedAt).getTime()) / 1000,
    );
    const ended = await SessionRepository.end(sessionId, totalDuration);

    await GroupRepository.updateStatus(session.groupId, "COMPLETED");

    broadcastToSession(sessionId, "session:ended", {
      session_id: sessionId,
      ended_at: ended.endedAt,
      total_duration_seconds: totalDuration,
    });

    return ended;
  },

  async getSummary(sessionId: string) {
    const session = await SessionRepository.findSummary(sessionId);
    if (!session) throw makeError("Session not found", "NOT_FOUND", 404);

    return {
      session_id: session.id,
      mountain: session.mountain,
      started_at: session.startedAt,
      ended_at: session.endedAt,
      total_duration_seconds: session.totalDurationSeconds,
      members: session.members.map((m) => ({
        user_id: m.user.id,
        name: m.user.name,
        checkpoints_completed: m.checkpointsCompleted,
        total_time_seconds: m.totalTimeSeconds,
        checkpoint_records: session.checkpointRecords
          .filter((r) => r.userId === m.user.id)
          .map((r) => ({
            order_number: r.orderNumber,
            name: r.checkpoint.name,
            arrived_at: r.arrivedAt,
            elapsed_seconds: r.elapsedSeconds,
          })),
      })),
    };
  },
};
