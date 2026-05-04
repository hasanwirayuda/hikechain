import { Response } from "express";

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
): Response => res.status(statusCode).json({ success: true, data });

export const sendMessage = (
  res: Response,
  message: string,
  statusCode = 200,
): Response => res.status(statusCode).json({ success: true, message });

export const sendError = (
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
): Response =>
  res.status(statusCode).json({ success: false, error: { code, message } });
