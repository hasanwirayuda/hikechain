import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.utils";
import { sendError } from "../utils/response.utils";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; name: string };
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    sendError(
      res,
      "UNAUTHORIZED",
      "Missing or invalid Authorization header",
      401,
    );
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, name: payload.name };
    next();
  } catch {
    sendError(res, "TOKEN_INVALID", "Access token is invalid or expired", 401);
  }
};
