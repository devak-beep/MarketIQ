import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  browseListings,
  createListing,
  deleteListing,
  getListing,
  updateListing,
} from "../controllers/listing.controller.js";

const router = Router();

router.get("/", browseListings);
router.get("/:id", getListing);
router.post("/", requireAuth, createListing);
router.put("/:id", requireAuth, updateListing);
router.delete("/:id", requireAuth, deleteListing);

export default router;
