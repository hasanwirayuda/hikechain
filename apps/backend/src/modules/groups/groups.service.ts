import { GroupRepository } from "./groups.repository";
import type { CreateGroupDto, JoinGroupDto } from "./groups.schema";

const generateCode = (): string =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

const makeError = (msg: string, code: string, status: number) => {
  const err = new Error(msg) as Error & { code: string; statusCode: number };
  err.code = code;
  err.statusCode = status;
  return err;
};

export const GroupsService = {
  async create(userId: string, dto: CreateGroupDto) {
    let code = generateCode();
    while (await GroupRepository.findByCode(code)) {
      code = generateCode();
    }
    return GroupRepository.create({
      name: dto.name,
      mountainId: dto.mountain_id,
      leaderId: userId,
      code,
    });
  },

  async join(userId: string, dto: JoinGroupDto) {
    const group = await GroupRepository.findByCode(dto.code);
    if (!group) throw makeError("Group code not found", "INVALID_CODE", 404);
    if (group.status !== "WAITING")
      throw makeError("Group has already started hiking", "GROUP_STARTED", 400);
    if (await GroupRepository.isMember(group.id, userId))
      throw makeError("You are already in this group", "ALREADY_MEMBER", 400);
    const count = await GroupRepository.countMembers(group.id);
    if (count >= group.maxMembers)
      throw makeError(
        `Group has reached maximum members (${group.maxMembers})`,
        "GROUP_FULL",
        400,
      );
    await GroupRepository.addMember(group.id, userId);
    return GroupRepository.findById(group.id);
  },

  async getById(id: string) {
    const group = await GroupRepository.findById(id);
    if (!group) throw makeError("Group not found", "NOT_FOUND", 404);
    return group;
  },

  async removeMember(groupId: string, leaderId: string, targetUserId: string) {
    const group = await GroupRepository.findById(groupId);
    if (!group) throw makeError("Group not found", "NOT_FOUND", 404);
    if (group.leader.id !== leaderId)
      throw makeError("Only the leader can remove members", "FORBIDDEN", 403);
    if (targetUserId === leaderId)
      throw makeError("Leader cannot remove themselves", "FORBIDDEN", 403);
    await GroupRepository.removeMember(groupId, targetUserId);
  },

  async leave(groupId: string, userId: string) {
    const group = await GroupRepository.findById(groupId);
    if (!group) throw makeError("Group not found", "NOT_FOUND", 404);
    if (group.leader.id === userId)
      throw makeError(
        "Leader cannot leave — disband the group instead",
        "FORBIDDEN",
        403,
      );
    await GroupRepository.removeMember(groupId, userId);
  },
};
