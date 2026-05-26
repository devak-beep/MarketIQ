import { Router } from "express";
import { prisma } from "../utils/prisma.js";

const router = Router();

// GET /categories — returns parent categories with nested subcategories
router.get("/", async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      orderBy: { name: "asc" },
      include: {
        subcategories: { orderBy: { name: "asc" } },
      },
    });
    res.json({ data: categories });
  } catch (error) {
    next(error);
  }
});

export default router;
