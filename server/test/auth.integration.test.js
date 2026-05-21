import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { cleanDb, prisma } from "./db-setup.js";
import app from "../src/app.js";

// Integration tests: real database, no mocks
beforeEach(async () => {
  // Isolate each test - clean DB before each test except the first (migration handles it)
  // Actually, for speed, we'll just clean User/listings/offers but not categories
  await cleanDb();
});

describe("Auth Integration Tests", () => {
  it("register user with valid data", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Alice Seller",
      email: "alice@example.com",
      password: "SecurePass123!",
      role: "SELLER",
    });

    expect(res.status).toBe(201);
    expect(res.body.user.id).toBeDefined();
    expect(res.body.user.name).toBe("Alice Seller");
    expect(res.body.user.email).toBe("alice@example.com");
    expect(res.body.user.role).toBe("SELLER");
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    // Cookie should be set (http-only refresh token)
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("reject register with duplicate email", async () => {
    // Register first user
    await request(app).post("/api/auth/register").send({
      name: "Alice",
      email: "duplicate@example.com",
      password: "SecurePass123!",
    });

    // Try to register same email
    const res = await request(app).post("/api/auth/register").send({
      name: "Bob",
      email: "duplicate@example.com",
      password: "SecurePass123!",
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain("Email already in use");
  });

  it("login with correct credentials", async () => {
    // Register
    await request(app).post("/api/auth/register").send({
      name: "Charlie",
      email: "charlie@example.com",
      password: "SecurePass123!",
    });

    // Login
    const res = await request(app).post("/api/auth/login").send({
      email: "charlie@example.com",
      password: "SecurePass123!",
    });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("charlie@example.com");
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it("reject login with wrong password", async () => {
    // Register
    await request(app).post("/api/auth/register").send({
      name: "Dana",
      email: "dana@example.com",
      password: "SecurePass123!",
    });

    // Try login with wrong password
    const res = await request(app).post("/api/auth/login").send({
      email: "dana@example.com",
      password: "WrongPassword",
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toContain("Invalid credentials");
  });

  it("get user profile with valid token", async () => {
    // Register and get token
    const registerRes = await request(app).post("/api/auth/register").send({
      name: "Eve",
      email: "eve@example.com",
      password: "SecurePass123!",
    });

    const { accessToken } = registerRes.body;

    // Get profile
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("eve@example.com");
  });

  it("reject profile request without token", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.message).toContain("Missing authorization token");
  });

  it("refresh token rotates tokens", async () => {
    // Register
    const registerRes = await request(app).post("/api/auth/register").send({
      name: "Frank",
      email: "frank@example.com",
      password: "SecurePass123!",
    });

    const { refreshToken: oldRefreshToken } = registerRes.body;

    // Refresh
    const refreshRes = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: oldRefreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.accessToken).toBeDefined();
    expect(refreshRes.body.refreshToken).toBeDefined();
    // New refresh token should be different from old
    expect(refreshRes.body.refreshToken).not.toBe(oldRefreshToken);
  });

  it("logout invalidates refresh token", async () => {
    // Register
    const registerRes = await request(app).post("/api/auth/register").send({
      name: "Grace",
      email: "grace@example.com",
      password: "SecurePass123!",
    });

    const { refreshToken } = registerRes.body;

    // Logout
    const logoutRes = await request(app)
      .post("/api/auth/logout")
      .send({ refreshToken });

    expect(logoutRes.status).toBe(200);

    // Try to use old refresh token - should fail
    const refreshRes = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken });

    expect(refreshRes.status).toBe(401);
  });

  it("invalid token in authorization header is rejected", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid.token.here");

    expect(res.status).toBe(401);
    expect(res.body.message).toContain("Invalid or expired token");
  });
});
