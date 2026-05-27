import { z } from "zod";
import { prisma } from "../utils/prisma.js";

const listingSchema = z.object({
  categoryId: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z.string().min(1),
  ),
  title: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z.string().min(3),
  ),
  description: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z.string().min(3),
  ),
  condition: z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toUpperCase() : value),
    z.enum(["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"]),
  ),
  askingPrice: z.preprocess((value) => {
    if (typeof value === "string") {
      return value.replace(/[^0-9.-]/g, "").trim();
    }

    return value;
  }, z.coerce.number().positive()),
  imageUrls: z
    .preprocess(
      (value) => {
        if (Array.isArray(value)) {
          return value.filter(
            (item) => typeof item === "string" && item.trim().length > 0,
          );
        }

        if (typeof value === "string" && value.trim()) {
          return [value.trim()];
        }

        return [];
      },
      z.array(z.string().min(1)).default([]).optional(),
    )
    .nullable()
    .default([]),
});

export async function createListing(req, res, next) {
  try {
    const parsed = listingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.flatten() });
    }

    const category = await prisma.category.findUnique({
      where: { id: parsed.data.categoryId },
    });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const listing = await prisma.$transaction(async (tx) => {
      const created = await tx.listing.create({
        data: {
          sellerId: req.user.id,
          categoryId: parsed.data.categoryId,
          title: parsed.data.title,
          description: parsed.data.description,
          condition: parsed.data.condition,
          askingPrice: parsed.data.askingPrice,
        },
      });

      if (parsed.data.imageUrls.length > 0) {
        await tx.listingImage.createMany({
          data: parsed.data.imageUrls.map((url, index) => ({
            listingId: created.id,
            url,
            sortOrder: index,
          })),
        });
      }

      return tx.listing.findUnique({
        where: { id: created.id },
        include: {
          category: true,
          images: true,
          seller: { select: { id: true, name: true, email: true } },
        },
      });
    });

    res.status(201).json({ data: listing });
  } catch (error) {
    next(error);
  }
}

export async function updateListing(req, res, next) {
  try {
    const id = req.params.id;
    const existing = await prisma.listing.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Listing not found" });
    }
    if (existing.sellerId !== req.user.id) {
      return res.status(403).json({ message: "You do not own this listing" });
    }

    const payload = listingSchema.partial().safeParse(req.body);
    if (!payload.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: payload.error.flatten(),
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const data = { ...payload.data };
      delete data.imageUrls;

      if (data.categoryId) {
        const category = await tx.category.findUnique({
          where: { id: data.categoryId },
        });
        if (!category) {
          throw Object.assign(new Error("Category not found"), {
            statusCode: 404,
          });
        }
      }

      const listing = await tx.listing.update({ where: { id }, data });

      if (payload.data.imageUrls) {
        await tx.listingImage.deleteMany({ where: { listingId: id } });
        await tx.listingImage.createMany({
          data: payload.data.imageUrls.map((url, index) => ({
            listingId: id,
            url,
            sortOrder: index,
          })),
        });
      }

      return tx.listing.findUnique({
        where: { id },
        include: {
          category: true,
          images: true,
          seller: { select: { id: true, name: true, email: true } },
        },
      });
    });

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
}

export async function deleteListing(req, res, next) {
  try {
    const id = req.params.id;
    const existing = await prisma.listing.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Listing not found" });
    }
    if (existing.sellerId !== req.user.id) {
      return res.status(403).json({ message: "You do not own this listing" });
    }

    await prisma.listing.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function getListing(req, res, next) {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: {
        category: { include: { parent: true } },
        images: { orderBy: { sortOrder: "asc" } },
        seller: {
          select: { id: true, name: true, email: true, createdAt: true },
        },
      },
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    res.json({ data: listing });
  } catch (error) {
    next(error);
  }
}

export async function browseListings(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
    const skip = (page - 1) * limit;

    const minPrice = req.query.minPrice !== undefined ? Number(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice !== undefined ? Number(req.query.maxPrice) : null;
    const priceFilter = {};
    if (minPrice !== null && Number.isFinite(minPrice)) priceFilter.gte = minPrice;
    if (maxPrice !== null && Number.isFinite(maxPrice)) priceFilter.lte = maxPrice;

    let categoryFilter = {};
    if (req.query.categoryId) {
      const categoryId = String(req.query.categoryId);
      const subcategories = await prisma.category.findMany({
        where: { parentId: categoryId },
        select: { id: true },
      });
      const categoryIds = [categoryId, ...subcategories.map((item) => item.id)];
      categoryFilter = { categoryId: { in: categoryIds } };
    }

    const where = {
      isActive: true,
      ...categoryFilter,
      ...(Object.keys(priceFilter).length ? { askingPrice: priceFilter } : {}),
      ...(req.query.search
        ? {
            OR: [
              {
                title: {
                  contains: String(req.query.search),
                  mode: "insensitive",
                },
              },
              {
                description: {
                  contains: String(req.query.search),
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    };

    const sortBy = String(req.query.sortBy || "createdAt");
    const sortOrder = String(req.query.sortOrder || "desc");

    const [items, total] = await prisma.$transaction([
      prisma.listing.findMany({
        where,
        include: {
          category: { include: { parent: true } },
          images: { orderBy: { sortOrder: "asc" } },
          seller: { select: { id: true, name: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ]);

    res.json({
      data: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
}

export async function listMyListings(req, res, next) {
  try {
    const items = await prisma.listing.findMany({
      where: { sellerId: req.user.id },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ data: items });
  } catch (error) {
    next(error);
  }
}
