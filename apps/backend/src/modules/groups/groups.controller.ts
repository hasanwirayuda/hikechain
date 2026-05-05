import { Request, Response, NextFunction } from "express";
import { GroupsService } from "./groups.service";
import { CreateGroupSchema, JoinGroupSchema } from "./groups.schema";
import {
  sendSuccess,
  sendMessage,
  sendError,
} from "../../shared/utils/response.utils";

export const GroupsController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = CreateGroupSchema.safeParse(req.body);
      if (!dto.success)
        return sendError(res, "VALIDATION_ERROR", dto.error.errors[0].message);
      return sendSuccess(
        res,
        await GroupsService.create(req.user!.id, dto.data),
        201,
      );
    } catch (err) {
      next(err);
    }
  },

  async join(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = JoinGroupSchema.safeParse(req.body);
      if (!dto.success)
        return sendError(res, "VALIDATION_ERROR", dto.error.errors[0].message);
      return sendSuccess(res, await GroupsService.join(req.user!.id, dto.data));
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      return sendSuccess(res, await GroupsService.getById(req.params.id));
    } catch (err) {
      next(err);
    }
  },

  async removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      await GroupsService.removeMember(
        req.params.id,
        req.user!.id,
        req.params.userId,
      );
      return sendMessage(res, "Member removed");
    } catch (err) {
      next(err);
    }
  },

  async leave(req: Request, res: Response, next: NextFunction) {
    try {
      await GroupsService.leave(req.params.id, req.user!.id);
      return sendMessage(res, "Left group successfully");
    } catch (err) {
      next(err);
    }
  },
};
