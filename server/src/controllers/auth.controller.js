import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["BUYER", "SELLER"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

export async function register(req, res, next) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.flatten() });
    }

    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: parsed.data.role || "BUYER",
      },
    });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    const hashed = await bcrypt.hash(refreshToken, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashed },
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: Number(
        process.env.REFRESH_TOKEN_MAX_AGE || 7 * 24 * 60 * 60 * 1000,
      ),
      path: "/api/auth/refresh",
    };

    // set http-only cookie for web clients and also return refresh token for mobile clients
    res.cookie("refreshToken", refreshToken, cookieOptions);

    res
      .status(201)
      .json({ user: sanitizeUser(user), accessToken, refreshToken });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.flatten() });
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    const hashed = await bcrypt.hash(refreshToken, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashed },
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: Number(
        process.env.REFRESH_TOKEN_MAX_AGE || 7 * 24 * 60 * 60 * 1000,
      ),
      path: "/api/auth/refresh",
    };

    res.cookie("refreshToken", refreshToken, cookieOptions);

    res.json({ user: sanitizeUser(user), accessToken, refreshToken });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req, res, next) {
  try {
    // support cookie or body for refresh token (cookie for web, body for native)
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken)
      return res.status(400).json({ message: "Missing refreshToken" });

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || !user.refreshToken)
      return res.status(401).json({ message: "Unauthorized" });

    const ok = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!ok) return res.status(401).json({ message: "Refresh token revoked" });

    // rotate
    const newAccess = signAccessToken(user);
    const newRefresh = signRefreshToken(user);
    const newHash = await bcrypt.hash(newRefresh, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newHash },
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: Number(
        process.env.REFRESH_TOKEN_MAX_AGE || 7 * 24 * 60 * 60 * 1000,
      ),
      path: "/api/auth/refresh",
    };

    res.cookie("refreshToken", newRefresh, cookieOptions);

    res.json({ accessToken: newAccess, refreshToken: newRefresh });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) return res.status(200).json({ message: "Logged out" });

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      // clear cookie anyway
      res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
      return res.status(200).json({ message: "Logged out" });
    }

    await prisma.user.updateMany({
      where: { id: payload.id },
      data: { refreshToken: null },
    });
    res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
    return res.status(200).json({ message: "Logged out" });
  } catch (error) {
    next(error);
  }
}

export async function me(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json({ user: sanitizeUser(user) });
}
