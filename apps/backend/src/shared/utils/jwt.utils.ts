import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

export interface JwtPayload {
  sub: string;
  name: string;
  jti: string;
  iat?: number;
  exp?: number;
}

const JWT_SECRET = process.env.JWT_SECRET ?? "dev_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "24h";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? "dev_refresh_secret";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? "30d";

export const signToken = (userId: string, name: string): string =>
  jwt.sign({ sub: userId, name, jti: uuidv4() } as JwtPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);

export const signRefreshToken = (userId: string, name: string): string =>
  jwt.sign(
    { sub: userId, name, jti: uuidv4() } as JwtPayload,
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions,
  );

export const verifyToken = (token: string): JwtPayload =>
  jwt.verify(token, JWT_SECRET) as JwtPayload;

export const verifyRefreshToken = (token: string): JwtPayload =>
  jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
