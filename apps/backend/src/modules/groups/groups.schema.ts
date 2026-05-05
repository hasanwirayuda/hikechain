import { z } from "zod";

export const CreateGroupSchema = z.object({
  name: z.string().min(2, "Group name must be at least 2 characters"),
  mountain_id: z.string().uuid("Invalid mountain ID"),
});

export const JoinGroupSchema = z.object({
  code: z.string().min(4).max(8),
});

export type CreateGroupDto = z.infer<typeof CreateGroupSchema>;
export type JoinGroupDto = z.infer<typeof JoinGroupSchema>;
