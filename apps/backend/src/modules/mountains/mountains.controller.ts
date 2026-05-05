import { Request, Response, NextFunction } from "express";
import { MountainsService } from "./mountains.service";
import { sendSuccess, sendError } from "../../shared/utils/response.utils";

export const MountainsController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      return sendSuccess(res, await MountainsService.getAll());
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      return sendSuccess(res, await MountainsService.getById(req.params.id));
    } catch (err) {
      next(err);
    }
  },
};
