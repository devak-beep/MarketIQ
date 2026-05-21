import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  createOffer,
  listReceivedOffers,
  listSentOffers,
  updateOfferStatus,
} from "../controllers/offer.controller.js";

const router = Router();

router.post("/", requireAuth, createOffer);
router.get("/sent", requireAuth, listSentOffers);
router.get("/received", requireAuth, listReceivedOffers);
router.patch("/:id/status", requireAuth, updateOfferStatus);

export default router;
