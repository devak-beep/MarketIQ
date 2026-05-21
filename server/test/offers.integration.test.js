import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { cleanDb, prisma } from "./db-setup.js";
import app from "../src/app.js";

// Integration tests for Offer API
beforeEach(async () => {
  await cleanDb();
});

async function createTestUser(email, role = "BUYER") {
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

async function createTestListing(sellerToken, title = "Test Item") {
  const categories = await prisma.category.findMany();
  const res = await request(app)
    .post("/api/listings")
    .set("Authorization", `Bearer ${sellerToken}`)
    .send({
      title,
      description: "Test item for offer",
      condition: "GOOD",
      categoryId: categories[0].id,
      askingPrice: 299.99,
    });
  return res.body.listing;
}

describe("Offer Integration Tests", () => {
  describe.skip("Offer workflows (endpoints needed: POST /api/offers, PATCH /api/offers/:id/status)", () => {
    it("buyer can create an offer", async () => {
      const seller = await createTestUser("seller@example.com", "SELLER");
      const buyer = await createTestUser("buyer@example.com", "BUYER");

      const listing = await createTestListing(seller.token);

      const res = await request(app)
        .post("/api/offers")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({
          listingId: listing.id,
          offerPrice: 250.0,
          message: "Great item, can you accept 250?",
        });

      expect(res.status).toBe(201);
      expect(res.body.offer.listingId).toBe(listing.id);
      expect(res.body.offer.buyerId).toBe(buyer.user.id);
      expect(res.body.offer.offerPrice).toBe("250");
      expect(res.body.offer.status).toBe("PENDING");
    });

    it("one offer per buyer per listing", async () => {
      const seller = await createTestUser("seller2@example.com", "SELLER");
      const buyer = await createTestUser("buyer2@example.com", "BUYER");

      const listing = await createTestListing(seller.token);

      // Create first offer
      await request(app)
        .post("/api/offers")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({
          listingId: listing.id,
          offerPrice: 250.0,
        });

      // Try to create second offer - should fail
      const res = await request(app)
        .post("/api/offers")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({
          listingId: listing.id,
          offerPrice: 260.0,
        });

      expect(res.status).toBe(409);
    });

    it("seller can view received offers", async () => {
      const seller = await createTestUser("seller3@example.com", "SELLER");
      const buyer1 = await createTestUser("buyer3a@example.com", "BUYER");
      const buyer2 = await createTestUser("buyer3b@example.com", "BUYER");

      const listing = await createTestListing(seller.token);

      // Two buyers make offers
      await request(app)
        .post("/api/offers")
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({
          listingId: listing.id,
          offerPrice: 280.0,
        });

      await request(app)
        .post("/api/offers")
        .set("Authorization", `Bearer ${buyer2.token}`)
        .send({
          listingId: listing.id,
          offerPrice: 270.0,
        });

      // Seller views received offers
      const res = await request(app)
        .get("/api/offers/received")
        .set("Authorization", `Bearer ${seller.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data.every((o) => o.status === "PENDING")).toBe(true);
    });

    it("buyer can view sent offers", async () => {
      const seller = await createTestUser("seller4@example.com", "SELLER");
      const buyer = await createTestUser("buyer4@example.com", "BUYER");

      const listing1 = await createTestListing(seller.token, "Item 1");
      const listing2 = await createTestListing(seller.token, "Item 2");

      // Buyer makes two offers
      await request(app)
        .post("/api/offers")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({
          listingId: listing1.id,
          offerPrice: 250.0,
        });

      await request(app)
        .post("/api/offers")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({
          listingId: listing2.id,
          offerPrice: 240.0,
        });

      // Buyer views sent offers
      const res = await request(app)
        .get("/api/offers/sent")
        .set("Authorization", `Bearer ${buyer.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it("seller can accept offer", async () => {
      const seller = await createTestUser("seller5@example.com", "SELLER");
      const buyer = await createTestUser("buyer5@example.com", "BUYER");

      const listing = await createTestListing(seller.token);

      // Create offer
      const offerRes = await request(app)
        .post("/api/offers")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({
          listingId: listing.id,
          offerPrice: 280.0,
        });

      const offerId = offerRes.body.offer.id;

      // Seller accepts
      const acceptRes = await request(app)
        .patch(`/api/offers/${offerId}/status`)
        .set("Authorization", `Bearer ${seller.token}`)
        .send({
          status: "ACCEPTED",
        });

      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.offer.status).toBe("ACCEPTED");
    });

    it("seller can reject offer", async () => {
      const seller = await createTestUser("seller6@example.com", "SELLER");
      const buyer = await createTestUser("buyer6@example.com", "BUYER");

      const listing = await createTestListing(seller.token);

      const offerRes = await request(app)
        .post("/api/offers")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({
          listingId: listing.id,
          offerPrice: 200.0,
        });

      const offerId = offerRes.body.offer.id;

      // Seller rejects (too low)
      const rejectRes = await request(app)
        .patch(`/api/offers/${offerId}/status`)
        .set("Authorization", `Bearer ${seller.token}`)
        .send({
          status: "REJECTED",
        });

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.offer.status).toBe("REJECTED");
    });

    it("non-seller cannot update offer status", async () => {
      const seller = await createTestUser("seller7@example.com", "SELLER");
      const buyer1 = await createTestUser("buyer7a@example.com", "BUYER");
      const buyer2 = await createTestUser("buyer7b@example.com", "BUYER");

      const listing = await createTestListing(seller.token);

      const offerRes = await request(app)
        .post("/api/offers")
        .set("Authorization", `Bearer ${buyer1.token}`)
        .send({
          listingId: listing.id,
          offerPrice: 250.0,
        });

      const offerId = offerRes.body.offer.id;

      // Different buyer tries to update status - should fail
      const res = await request(app)
        .patch(`/api/offers/${offerId}/status`)
        .set("Authorization", `Bearer ${buyer2.token}`)
        .send({
          status: "ACCEPTED",
        });

      expect(res.status).toBe(403);
    });

    it("listing becomes inactive when offer accepted", async () => {
      const seller = await createTestUser("seller8@example.com", "SELLER");
      const buyer = await createTestUser("buyer8@example.com", "BUYER");

      const listing = await createTestListing(seller.token);

      // Verify listing is active
      let getRes = await request(app).get(`/api/listings/${listing.id}`);
      expect(getRes.body.listing.isActive).toBe(true);

      // Create and accept offer
      const offerRes = await request(app)
        .post("/api/offers")
        .set("Authorization", `Bearer ${buyer.token}`)
        .send({
          listingId: listing.id,
          offerPrice: 290.0,
        });

      await request(app)
        .patch(`/api/offers/${offerRes.body.offer.id}/status`)
        .set("Authorization", `Bearer ${seller.token}`)
        .send({
          status: "ACCEPTED",
        });

      // Check listing is now inactive
      getRes = await request(app).get(`/api/listings/${listing.id}`);
      expect(getRes.body.listing.isActive).toBe(false);
    });
  });
});
