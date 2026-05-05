import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import {
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
  FcmTokenSchema,
} from "./auth.schema";
import {
  sendSuccess,
  sendMessage,
  sendError,
} from "../../shared/utils/response.utils";

export const AuthController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = RegisterSchema.safeParse(req.body);
      if (!dto.success)
        return sendError(res, "VALIDATION_ERROR", dto.error.errors[0].message);
      return sendSuccess(res, await AuthService.register(dto.data), 201);
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = LoginSchema.safeParse(req.body);
      if (!dto.success)
        return sendError(res, "VALIDATION_ERROR", dto.error.errors[0].message);
      return sendSuccess(res, await AuthService.login(dto.data));
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = RefreshTokenSchema.safeParse(req.body);
      if (!dto.success)
        return sendError(res, "VALIDATION_ERROR", dto.error.errors[0].message);
      return sendSuccess(res, await AuthService.refresh(dto.data));
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refresh_token } = req.body as { refresh_token?: string };
      await AuthService.logout(req.user!.id, refresh_token ?? "");
      return sendMessage(res, "Logged out successfully");
    } catch (err) {
      next(err);
    }
  },

  async updateFcmToken(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = FcmTokenSchema.safeParse(req.body);
      if (!dto.success)
        return sendError(res, "VALIDATION_ERROR", dto.error.errors[0].message);
      await AuthService.updateFcmToken(req.user!.id, dto.data.fcm_token);
      return sendMessage(res, "FCM token updated");
    } catch (err) {
      next(err);
    }
  },
};
