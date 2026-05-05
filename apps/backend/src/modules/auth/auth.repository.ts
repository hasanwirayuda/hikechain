import { prisma } from "../../shared/lib/prisma";
import { User } from "@prisma/client";

export const AuthRepository = {
  findByEmail: (email: string): Promise<User | null> =>
    prisma.user.findUnique({ where: { email } }),

  findById: (id: string): Promise<User | null> =>
    prisma.user.findUnique({ where: { id } }),

  create: (data: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<User> => prisma.user.create({ data }),

  updateFcmToken: (userId: string, fcmToken: string): Promise<User> =>
    prisma.user.update({ where: { id: userId }, data: { fcmToken } }),
};
