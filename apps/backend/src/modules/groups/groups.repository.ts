import { prisma } from "../../shared/lib/prisma";
import { GroupStatus, GroupMemberRole } from "@prisma/client";

const groupWithRelations = {
  mountain: { select: { id: true, name: true, totalCheckpoints: true } },
  leader: { select: { id: true, name: true } },
  members: {
    select: {
      id: true,
      role: true,
      joinedAt: true,
      user: { select: { id: true, name: true } },
    },
  },
};

export const GroupRepository = {
  create: (data: {
    name: string;
    mountainId: string;
    leaderId: string;
    code: string;
  }) =>
    prisma.group.create({
      data: {
        ...data,
        members: {
          create: { userId: data.leaderId, role: GroupMemberRole.LEADER },
        },
      },
      include: groupWithRelations,
    }),

  findByCode: (code: string) =>
    prisma.group.findUnique({ where: { code }, include: groupWithRelations }),

  findById: (id: string) =>
    prisma.group.findUnique({ where: { id }, include: groupWithRelations }),

  addMember: (groupId: string, userId: string) =>
    prisma.groupMember.create({
      data: { groupId, userId, role: GroupMemberRole.MEMBER },
    }),

  removeMember: (groupId: string, userId: string) =>
    prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId } },
    }),

  countMembers: (groupId: string) =>
    prisma.groupMember.count({ where: { groupId } }),

  updateStatus: (id: string, status: GroupStatus) =>
    prisma.group.update({ where: { id }, data: { status } }),

  isMember: async (groupId: string, userId: string): Promise<boolean> => {
    const m = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    return !!m;
  },
};
