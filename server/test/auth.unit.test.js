import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("../src/utils/prisma.js", () => {
  const findUnique = vi.fn();
  const create = vi.fn();
  const update = vi.fn();
  const updateMany = vi.fn();
  return {
    prisma: {
      user: {
        findUnique,
        create,
        update,
        updateMany,
      },
    },
  };
});

vi.mock("../src/utils/jwt.js", () => ({
  signAccessToken: vi.fn(() => "access-token"),
  signRefreshToken: vi.fn(() => "refresh-token"),
  verifyRefreshToken: vi.fn(() => ({ id: "user-id" })),
  verifyAccessToken: vi.fn(() => ({ id: "user-id" })),
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(async (s) => `hashed-${s}`),
    compare: vi.fn(async () => true),
  },
}));

import { prisma } from "../src/utils/prisma.js";
import app from "../src/app.js";

beforeEach(() => {
  // reset mocks
  prisma.user.findUnique.mockReset();
  prisma.user.create.mockReset();
  prisma.user.update.mockReset();
  prisma.user.updateMany &&
    prisma.user.updateMany.mockReset &&
    prisma.user.updateMany.mockReset();
});

describe("Auth routes", () => {
  it("register -> returns tokens and sets cookie", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: "u1",
      name: "Test",
      email: "t@example.com",
      passwordHash: "x",
      role: "BUYER",
    });
    prisma.user.update.mockResolvedValue({});

    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test", email: "t@example.com", password: "password" });

    if (res.status >= 400) console.log("REGISTER ERROR BODY:", res.body);

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBe("access-token");
    expect(res.body.refreshToken).toBe("refresh-token");
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("login -> returns tokens and sets cookie", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      name: "Test",
      email: "t@example.com",
      passwordHash: "x",
      role: "BUYER",
    });
    prisma.user.update.mockResolvedValue({});

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "t@example.com", password: "password" });

    if (res.status >= 400) console.log("LOGIN ERROR BODY:", res.body);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBe("access-token");
    expect(res.body.refreshToken).toBe("refresh-token");
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("refresh -> rotates tokens when cookie present", async () => {
    // user has a refresh token stored (mocked compare returns true)
    prisma.user.findUnique.mockResolvedValue({
      id: "user-id",
      refreshToken: "hashed-refresh",
    });
    prisma.user.update.mockResolvedValue({});

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", ["refreshToken=refresh-token"])
      .send();
    if (res.status >= 400) console.log("REFRESH ERROR BODY:", res.body);
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBe("access-token");
    expect(res.body.refreshToken).toBe("refresh-token");
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("logout -> clears cookie and returns 200", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", ["refreshToken=refresh-token"])
      .send();
    expect(res.status).toBe(200);
  });
});
