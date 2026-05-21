import { Router } from "express";
import authRoutes from "./auth.routes.js";
import listingRoutes from "./listing.routes.js";
import offerRoutes from "./offer.routes.js";
import categoryRoutes from "./category.routes.js";
import uploadRoutes from "./upload.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/listings", listingRoutes);
router.use("/offers", offerRoutes);
router.use("/categories", categoryRoutes);
router.use("/upload", uploadRoutes);

export default router;
