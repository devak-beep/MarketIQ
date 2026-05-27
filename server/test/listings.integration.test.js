import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { cleanDb, prisma } from "./db-setup.js";
import app from "../src/app.js";

// Integration tests for Listing API
beforeEach(async () => {
  await cleanDb();
});

async function createTestUser(email, role = "SELLER") {
  const res = await request(app)
    .post("/api/auth/register")
    .send({
      name: `User ${email}`,
      email,
      password: "SecurePass123!",
      role,
    });
  return { token: res.body.accessToken, user: res.body.user };
}

describe("Listing Integration Tests", () => {
  describe.skip("Listing CRUD (endpoints needed: POST/PUT/DELETE /api/listings)", () => {
    it("seller can create a listing", async () => {
      const { token, user } = await createTestUser(
        "seller@example.com",
        "SELLER",
      );

      const categories = await prisma.category.findMany();
      const categoryId = categories[0].id;

      const res = await request(app)
        .post("/api/listings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Used Laptop",
          description: "Dell XPS 13, great condition",
          condition: "GOOD",
          categoryId,
          askingPrice: 499.99,
        });

      expect(res.status).toBe(201);
      expect(res.body.listing.id).toBeDefined();
      expect(res.body.listing.title).toBe("Used Laptop");
      expect(res.body.listing.sellerId).toBe(user.id);
      expect(res.body.listing.isActive).toBe(true);
    });

    it("reject listing creation without auth", async () => {
      const categories = await prisma.category.findMany();

      const res = await request(app).post("/api/listings").send({
        title: "Used Laptop",
        description: "Dell XPS 13",
        condition: "GOOD",
        categoryId: categories[0].id,
        askingPrice: 499.99,
      });

      expect(res.status).toBe(401);
    });

    it("buyer can view all listings", async () => {
      const seller = await createTestUser("seller2@example.com", "SELLER");
      const categories = await prisma.category.findMany();

      // Create a listing
      await request(app)
        .post("/api/listings")
        .set("Authorization", `Bearer ${seller.token}`)
        .send({
          title: "Test Item",
          description: "Test",
          condition: "NEW",
          categoryId: categories[0].id,
          askingPrice: 99.99,
        });

      // Browse listings
      const res = await request(app).get("/api/listings");

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].title).toBe("Test Item");
    });

    it("seller can update their listing", async () => {
      const { token, user } = await createTestUser(
        "seller3@example.com",
        "SELLER",
      );
      const categories = await prisma.category.findMany();

      // Create listing
      const createRes = await request(app)
        .post("/api/listings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Original Title",
          description: "Original desc",
          condition: "GOOD",
          categoryId: categories[0].id,
          askingPrice: 299.99,
        });

      const listingId = createRes.body.listing.id;

      // Update listing
      const updateRes = await request(app)
        .put(`/api/listings/${listingId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Updated Title",
          description: "Updated description",
          askingPrice: 249.99,
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.listing.title).toBe("Updated Title");
      expect(updateRes.body.listing.askingPrice).toBe("249.99");
    });

    it("seller cannot update another seller's listing", async () => {
      const seller1 = await createTestUser("seller4a@example.com", "SELLER");
      const seller2 = await createTestUser("seller4b@example.com", "SELLER");
      const categories = await prisma.category.findMany();

      // Seller1 creates listing
      const createRes = await request(app)
        .post("/api/listings")
        .set("Authorization", `Bearer ${seller1.token}`)
        .send({
          title: "Seller1 Item",
          description: "Only seller1 can edit",
          condition: "NEW",
          categoryId: categories[0].id,
          askingPrice: 199.99,
        });

      const listingId = createRes.body.listing.id;

      // Seller2 tries to update
      const updateRes = await request(app)
        .put(`/api/listings/${listingId}`)
        .set("Authorization", `Bearer ${seller2.token}`)
        .send({
          title: "Hacked Title",
        });

      expect(updateRes.status).toBe(403);
    });

    it("seller can delete their listing", async () => {
      const { token } = await createTestUser("seller5@example.com", "SELLER");
      const categories = await prisma.category.findMany();

      // Create listing
      const createRes = await request(app)
        .post("/api/listings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Delete Me",
          description: "Test delete",
          condition: "FAIR",
          categoryId: categories[0].id,
          askingPrice: 49.99,
        });

      const listingId = createRes.body.listing.id;

      // Delete
      const deleteRes = await request(app)
        .delete(`/api/listings/${listingId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(deleteRes.status).toBe(200);

      // Verify deleted
      const getRes = await request(app).get(`/api/listings/${listingId}`);
      expect(getRes.status).toBe(404);
    });

    it("filter listings by category", async () => {
      const { token } = await createTestUser("seller6@example.com", "SELLER");
      const categories = await prisma.category.findMany();

      // Create listings in different categories
      for (let i = 0; i < categories.length && i < 2; i++) {
        await request(app)
          .post("/api/listings")
          .set("Authorization", `Bearer ${token}`)
          .send({
            title: `Item in ${categories[i].name}`,
            description: "Test",
            condition: "NEW",
            categoryId: categories[i].id,
            askingPrice: 99.99,
          });
      }

      // Filter by first category
      const res = await request(app).get(
        `/api/listings?categoryId=${categories[0].id}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.data.some((l) => l.categoryId === categories[0].id)).toBe(
        true,
      );
    });

    it("includes subcategory listings when filtering by parent category", async () => {
      const { token } = await createTestUser("seller7@example.com", "SELLER");
      const parent = await prisma.category.upsert({
        where: { slug: "test-parent-category" },
        update: {},
        create: { name: "Test Parent Category", slug: "test-parent-category" },
      });
      const child = await prisma.category.upsert({
        where: { slug: "test-child-category" },
        update: { parentId: parent.id },
        create: {
          name: "Test Child Category",
          slug: "test-child-category",
          parentId: parent.id,
        },
      });

      await request(app)
        .post("/api/listings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Item in child category",
          description: "Test",
          condition: "NEW",
          categoryId: child.id,
          askingPrice: 99.99,
        });

      const res = await request(app).get(
        `/api/listings?categoryId=${parent.id}`,
      );

      expect(res.status).toBe(200);
      expect(
        res.body.data.some((listing) => listing.categoryId === child.id),
      ).toBe(true);
    });
  });
});
