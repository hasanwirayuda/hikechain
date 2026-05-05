import { Request, Response, NextFunction } from "express";
import { SessionsService } from "./sessions.service";
import { sendSuccess, sendError } from "../../shared/utils/response.utils";

export const SessionsController = {
  async start(req: Request, res: Response, next: NextFunction) {
    try {
      const { group_id } = req.body as { group_id?: string };
      if (!group_id)
        return sendError(res, "VALIDATION_ERROR", "group_id is required");
      return sendSuccess(
        res,
        await SessionsService.start(req.user!.id, group_id),
        201,
      );
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      return sendSuccess(res, await SessionsService.getById(req.params.id));
    } catch (err) {
      next(err);
    }
  },

  async end(req: Request, res: Response, next: NextFunction) {
    try {
      return sendSuccess(
        res,
        await SessionsService.end(req.params.id, req.user!.id),
      );
    } catch (err) {
      next(err);
    }
  },

  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      return sendSuccess(res, await SessionsService.getSummary(req.params.id));
    } catch (err) {
      next(err);
    }
  },
};
