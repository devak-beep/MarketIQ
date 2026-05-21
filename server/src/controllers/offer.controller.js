import { z } from "zod";
import { prisma } from "../utils/prisma.js";

const offerSchema = z.object({
  listingId: z.string().min(1),
  offerPrice: z.coerce.number().positive(),
  message: z.string().max(500).optional(),
});

const statusSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
});

export async function createOffer(req, res, next) {
  try {
    const parsed = offerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.flatten() });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: parsed.data.listingId },
    });
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }
    if (listing.sellerId === req.user.id) {
      return res
        .status(400)
        .json({ message: "Cannot make an offer on your own listing" });
    }

    const offer = await prisma.offer.create({
      data: {
        listingId: parsed.data.listingId,
        buyerId: req.user.id,
        offerPrice: parsed.data.offerPrice,
        message: parsed.data.message,
      },
      include: {
        listing: {
          select: { id: true, title: true, askingPrice: true, sellerId: true },
        },
        buyer: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json({ data: offer });
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ message: "Duplicate offer already exists for this listing" });
    }
    next(error);
  }
}

export async function listSentOffers(req, res, next) {
  try {
    const offers = await prisma.offer.findMany({
      where: { buyerId: req.user.id },
      include: { listing: { include: { category: true, images: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ data: offers });
  } catch (error) {
    next(error);
  }
}

export async function listReceivedOffers(req, res, next) {
  try {
    const offers = await prisma.offer.findMany({
      where: { listing: { sellerId: req.user.id } },
      include: {
        listing: {
          select: { id: true, title: true, askingPrice: true, sellerId: true },
        },
        buyer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ data: offers });
  } catch (error) {
    next(error);
  }
}

export async function updateOfferStatus(req, res, next) {
  try {
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.flatten() });
    }

    const offer = await prisma.offer.findUnique({
      where: { id: req.params.id },
      include: { listing: true },
    });

    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }
    if (offer.listing.sellerId !== req.user.id) {
      return res.status(403).json({ message: "You do not own this listing" });
    }

    const updated = await prisma.offer.update({
      where: { id: req.params.id },
      data: { status: parsed.data.status },
    });

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
}
