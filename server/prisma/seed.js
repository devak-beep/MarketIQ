import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES = [
  {
    name: "Electronics", slug: "electronics",
    subcategories: [
      { name: "Mobile Phones", slug: "mobile-phones" },
      { name: "Laptops", slug: "laptops" },
      { name: "Tablets", slug: "tablets" },
      { name: "Cameras", slug: "cameras" },
      { name: "Audio & Headphones", slug: "audio-headphones" },
      { name: "Video Games & Consoles", slug: "video-games-consoles" },
      { name: "TV & Home Theatre", slug: "tv-home-theatre" },
    ],
  },
  {
    name: "Fashion", slug: "fashion",
    subcategories: [
      { name: "Women's Clothing", slug: "womens-clothing" },
      { name: "Men's Clothing", slug: "mens-clothing" },
      { name: "Shoes", slug: "shoes" },
      { name: "Bags & Accessories", slug: "bags-accessories" },
      { name: "Jewellery", slug: "jewellery" },
    ],
  },
  {
    name: "Furniture", slug: "furniture",
    subcategories: [
      { name: "Beds & Wardrobes", slug: "beds-wardrobes" },
      { name: "Sofas & Seating", slug: "sofas-seating" },
      { name: "Tables & Desks", slug: "tables-desks" },
      { name: "Storage & Shelving", slug: "storage-shelving" },
    ],
  },
  {
    name: "Bikes & Vehicles", slug: "bikes",
    subcategories: [
      { name: "Motorcycles", slug: "motorcycles" },
      { name: "Scooters", slug: "scooters" },
      { name: "Bicycles", slug: "bicycles" },
    ],
  },
  {
    name: "Games & Hobbies", slug: "games",
    subcategories: [
      { name: "Video Games", slug: "video-games" },
      { name: "Board Games", slug: "board-games" },
      { name: "Collectibles", slug: "collectibles" },
    ],
  },
  {
    name: "Appliances", slug: "appliances",
    subcategories: [
      { name: "Kitchen Appliances", slug: "kitchen-appliances" },
      { name: "Washing Machines", slug: "washing-machines" },
      { name: "Air Conditioners", slug: "air-conditioners" },
      { name: "Refrigerators", slug: "refrigerators" },
    ],
  },
  {
    name: "Books", slug: "books",
    subcategories: [
      { name: "Textbooks", slug: "textbooks" },
      { name: "Fiction", slug: "fiction" },
      { name: "Non-Fiction", slug: "non-fiction" },
    ],
  },
  {
    name: "Sports & Fitness", slug: "fitness",
    subcategories: [
      { name: "Gym Equipment", slug: "gym-equipment" },
      { name: "Outdoor Sports", slug: "outdoor-sports" },
      { name: "Cycles & Skating", slug: "cycles-skating" },
    ],
  },
  {
    name: "Beauty & Personal Care", slug: "beauty",
    subcategories: [
      { name: "Skincare", slug: "skincare" },
      { name: "Makeup", slug: "makeup" },
      { name: "Hair Care", slug: "hair-care" },
    ],
  },
  {
    name: "Home & Kitchen", slug: "home",
    subcategories: [
      { name: "Cookware", slug: "cookware" },
      { name: "Bedding & Linen", slug: "bedding-linen" },
      { name: "Home Decor", slug: "home-decor" },
    ],
  },
];

async function main() {
  for (const cat of CATEGORIES) {
    const parent = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { name: cat.name, slug: cat.slug },
    });

    for (const sub of cat.subcategories) {
      await prisma.category.upsert({
        where: { slug: sub.slug },
        update: { name: sub.name, parentId: parent.id },
        create: { name: sub.name, slug: sub.slug, parentId: parent.id },
      });
    }
  }

  const total = await prisma.category.count();
  console.log(`Seeded ${total} categories (parents + subcategories).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
