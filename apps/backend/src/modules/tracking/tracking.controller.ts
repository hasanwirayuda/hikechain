import { Request, Response, NextFunction } from "express";
import { TrackingService } from "./tracking.service";
import { LocationBatchSchema } from "./tracking.schema";
import { sendSuccess, sendError } from "../../shared/utils/response.utils";

export const TrackingController = {
  async uploadLocations(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = LocationBatchSchema.safeParse(req.body);
      if (!dto.success)
        return sendError(res, "VALIDATION_ERROR", dto.error.errors[0].message);
      return sendSuccess(
        res,
        await TrackingService.uploadLocations(
          req.params.id,
          req.user!.id,
          dto.data,
        ),
        201,
      );
    } catch (err) {
      next(err);
    }
  },

  async getLatestLocations(req: Request, res: Response, next: NextFunction) {
    try {
      return sendSuccess(
        res,
        await TrackingService.getLatestLocations(req.params.id),
      );
    } catch (err) {
      next(err);
    }
  },
};
