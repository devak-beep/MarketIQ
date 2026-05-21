import { Router } from "express";
import { uploadImage } from "../controllers/upload.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

// Protected upload endpoint
router.post("/image", requireAuth, uploadImage);

export default router;
