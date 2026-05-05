import bcrypt from "bcrypt";
import { AuthRepository } from "./auth.repository";
import {
  signToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../shared/utils/jwt.utils";
import { redis, RedisKeys } from "../../shared/lib/redis";
import type { RegisterDto, LoginDto, RefreshTokenDto } from "./auth.schema";

const BCRYPT_ROUNDS = 12;
const REFRESH_TTL = 60 * 60 * 24 * 30; // 30 days in seconds

const makeError = (msg: string, code: string, status: number) => {
  const err = new Error(msg) as Error & { code: string; statusCode: number };
  err.code = code;
  err.statusCode = status;
  return err;
};

const toPublicUser = (user: {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  created_at: user.createdAt,
});

export const AuthService = {
  async register(dto: RegisterDto) {
    const existing = await AuthRepository.findByEmail(dto.email);
    if (existing)
      throw makeError("Email already registered", "VALIDATION_ERROR", 400);

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await AuthRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });

    const token = signToken(user.id, user.name);
    const refreshToken = signRefreshToken(user.id, user.name);
    await redis.set(RedisKeys.refreshToken(user.id), refreshToken, {
      EX: REFRESH_TTL,
    });

    return { user: toPublicUser(user), token, refresh_token: refreshToken };
  },

  async login(dto: LoginDto) {
    const user = await AuthRepository.findByEmail(dto.email);
    const valid = user
      ? await bcrypt.compare(dto.password, user.passwordHash)
      : false;
    if (!user || !valid)
      throw makeError(
        "Email or password is incorrect",
        "INVALID_CREDENTIALS",
        401,
      );

    const token = signToken(user.id, user.name);
    const refreshToken = signRefreshToken(user.id, user.name);
    await redis.set(RedisKeys.refreshToken(user.id), refreshToken, {
      EX: REFRESH_TTL,
    });

    return { user: toPublicUser(user), token, refresh_token: refreshToken };
  },

  async refresh(dto: RefreshTokenDto) {
    let payload: ReturnType<typeof verifyRefreshToken>;
    try {
      payload = verifyRefreshToken(dto.refresh_token);
    } catch {
      throw makeError("Refresh token expired or invalid", "TOKEN_EXPIRED", 401);
    }

    const stored = await redis.get(RedisKeys.refreshToken(payload.sub));
    if (stored !== dto.refresh_token)
      throw makeError("Refresh token reuse detected", "TOKEN_REUSE", 401);

    const user = await AuthRepository.findById(payload.sub);
    if (!user) throw makeError("User not found", "NOT_FOUND", 404);

    const token = signToken(user.id, user.name);
    const refreshToken = signRefreshToken(user.id, user.name);
    await redis.set(RedisKeys.refreshToken(user.id), refreshToken, {
      EX: REFRESH_TTL,
    });

    return { token, refresh_token: refreshToken };
  },

  async logout(userId: string, refreshToken: string) {
    await redis.del(RedisKeys.refreshToken(userId));
    try {
      const payload = verifyRefreshToken(refreshToken);
      const ttl = (payload.exp ?? 0) - Math.floor(Date.now() / 1000);
      if (ttl > 0)
        await redis.set(RedisKeys.blacklist(payload.jti), "1", { EX: ttl });
    } catch {
      /* already expired */
    }
  },

  async updateFcmToken(userId: string, fcmToken: string) {
    await AuthRepository.updateFcmToken(userId, fcmToken);
  },
};
