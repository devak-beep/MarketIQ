import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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

// Sample products per subcategory slug
const SAMPLE_PRODUCTS = {
  // Electronics
  "mobile-phones": [
    { title: "Samsung Galaxy S23", description: "Excellent condition, 256GB, Phantom Black. Comes with original box and charger.", condition: "LIKE_NEW", askingPrice: 45000, images: ["https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600"] },
    { title: "iPhone 13 Pro", description: "128GB, Sierra Blue. Minor scratches on back, screen perfect.", condition: "GOOD", askingPrice: 52000, images: ["https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=600"] },
  ],
  "laptops": [
    { title: "Dell XPS 15 (2022)", description: "Intel i7, 16GB RAM, 512GB SSD. Barely used, perfect for work.", condition: "LIKE_NEW", askingPrice: 75000, images: ["https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600"] },
    { title: "MacBook Air M2", description: "8GB RAM, 256GB SSD, Space Grey. 1 year old, great battery life.", condition: "GOOD", askingPrice: 82000, images: ["https://images.unsplash.com/photo-1611186871525-9c4e3b6a8e6e?w=600"] },
  ],
  "tablets": [
    { title: "iPad Air 5th Gen", description: "64GB WiFi, Starlight. With Apple Pencil 2nd gen.", condition: "GOOD", askingPrice: 38000, images: ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600"] },
  ],
  "cameras": [
    { title: "Sony Alpha A7 III", description: "Full-frame mirrorless, body only. Shutter count under 5000.", condition: "LIKE_NEW", askingPrice: 120000, images: ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600"] },
    { title: "Canon EOS 200D", description: "18-55mm kit lens included. Great for beginners.", condition: "GOOD", askingPrice: 28000, images: ["https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600"] },
  ],
  "audio-headphones": [
    { title: "Sony WH-1000XM5", description: "Noise cancelling headphones. 1 year old, excellent sound.", condition: "GOOD", askingPrice: 18000, images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600"] },
  ],
  "video-games-consoles": [
    { title: "PlayStation 5 Disc Edition", description: "With 2 controllers and 3 games. Barely used.", condition: "LIKE_NEW", askingPrice: 42000, images: ["https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600"] },
  ],
  "tv-home-theatre": [
    { title: "LG 55\" OLED TV", description: "4K OLED, 2022 model. Perfect picture quality.", condition: "GOOD", askingPrice: 65000, images: ["https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=600"] },
  ],
  // Fashion
  "womens-clothing": [
    { title: "Zara Floral Midi Dress", description: "Size M, worn twice. Beautiful floral print.", condition: "LIKE_NEW", askingPrice: 1200, images: ["https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600"] },
    { title: "H&M Winter Coat", description: "Size L, dark navy. Warm and stylish.", condition: "GOOD", askingPrice: 2500, images: ["https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600"] },
  ],
  "mens-clothing": [
    { title: "Levi's 511 Slim Jeans", description: "Size 32x32, dark wash. Worn a few times.", condition: "GOOD", askingPrice: 1800, images: ["https://images.unsplash.com/photo-1542272604-787c3835535d?w=600"] },
    { title: "Nike Dri-FIT T-Shirt Pack", description: "3 shirts, size L. Great for gym.", condition: "NEW", askingPrice: 1500, images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600"] },
  ],
  "shoes": [
    { title: "Nike Air Max 270", description: "Size 10, white/black. Worn 3 times.", condition: "LIKE_NEW", askingPrice: 4500, images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"] },
    { title: "Adidas Ultraboost 22", description: "Size 9, core black. Great running shoes.", condition: "GOOD", askingPrice: 5500, images: ["https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600"] },
  ],
  "bags-accessories": [
    { title: "Leather Crossbody Bag", description: "Brown genuine leather, fits 13\" laptop.", condition: "GOOD", askingPrice: 3200, images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600"] },
  ],
  "jewellery": [
    { title: "Gold Plated Necklace Set", description: "Elegant set with earrings. Worn once.", condition: "LIKE_NEW", askingPrice: 800, images: ["https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600"] },
  ],
  // Furniture
  "beds-wardrobes": [
    { title: "Queen Size Bed Frame", description: "Solid wood, walnut finish. 2 years old, great condition.", condition: "GOOD", askingPrice: 12000, images: ["https://images.unsplash.com/photo-1505693314120-0d443867891c?w=600"] },
    { title: "3-Door Wardrobe", description: "White laminate, mirror on centre door. Self-assembly required.", condition: "GOOD", askingPrice: 8500, images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"] },
  ],
  "sofas-seating": [
    { title: "3-Seater Fabric Sofa", description: "Grey, L-shaped. 1 year old, no stains.", condition: "GOOD", askingPrice: 18000, images: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600"] },
  ],
  "tables-desks": [
    { title: "Standing Desk 140cm", description: "Electric height adjustable, white top. Perfect for WFH.", condition: "LIKE_NEW", askingPrice: 14000, images: ["https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600"] },
  ],
  "storage-shelving": [
    { title: "IKEA Kallax Shelf Unit", description: "4x4 grid, white. Includes 4 drawer inserts.", condition: "GOOD", askingPrice: 5500, images: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600"] },
  ],
  // Bikes & Vehicles
  "motorcycles": [
    { title: "Royal Enfield Classic 350", description: "2021 model, 8000 km. Gunmetal grey, single owner.", condition: "GOOD", askingPrice: 145000, images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"] },
  ],
  "scooters": [
    { title: "Honda Activa 6G", description: "2022, 5000 km. Pearl Igneous Black.", condition: "LIKE_NEW", askingPrice: 68000, images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"] },
  ],
  "bicycles": [
    { title: "Trek FX 3 Hybrid Bike", description: "Medium frame, 21-speed. Barely used.", condition: "LIKE_NEW", askingPrice: 22000, images: ["https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600"] },
  ],
  // Games & Hobbies
  "video-games": [
    { title: "God of War Ragnarök (PS5)", description: "Physical disc, played once.", condition: "LIKE_NEW", askingPrice: 2800, images: ["https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600"] },
    { title: "Elden Ring (PC)", description: "Steam key, unused.", condition: "NEW", askingPrice: 1500, images: ["https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600"] },
  ],
  "board-games": [
    { title: "Catan Board Game", description: "Complete set, all pieces intact.", condition: "GOOD", askingPrice: 2200, images: ["https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600"] },
  ],
  "collectibles": [
    { title: "Funko Pop Marvel Set (10 pcs)", description: "All in original boxes, never displayed.", condition: "NEW", askingPrice: 3500, images: ["https://images.unsplash.com/photo-1608889175123-8ee362201f81?w=600"] },
  ],
  // Appliances
  "kitchen-appliances": [
    { title: "Instant Pot Duo 7-in-1", description: "6 quart, used 5 times. All accessories included.", condition: "LIKE_NEW", askingPrice: 4500, images: ["https://images.unsplash.com/photo-1585515320310-259814833e62?w=600"] },
    { title: "Philips Air Fryer XL", description: "4.1L capacity. Works perfectly.", condition: "GOOD", askingPrice: 3800, images: ["https://images.unsplash.com/photo-1585515320310-259814833e62?w=600"] },
  ],
  "washing-machines": [
    { title: "Samsung 7kg Front Load Washer", description: "2021 model, works perfectly. Selling due to relocation.", condition: "GOOD", askingPrice: 22000, images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"] },
  ],
  "air-conditioners": [
    { title: "Daikin 1.5 Ton 5-Star Split AC", description: "2022 model, inverter technology. Includes installation kit.", condition: "GOOD", askingPrice: 32000, images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"] },
  ],
  "refrigerators": [
    { title: "LG 260L Double Door Fridge", description: "Frost-free, 3 years old. Works great.", condition: "GOOD", askingPrice: 18000, images: ["https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600"] },
  ],
  // Books
  "textbooks": [
    { title: "NCERT Physics Class 12 (Set)", description: "Both parts, minimal highlighting.", condition: "GOOD", askingPrice: 350, images: ["https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600"] },
    { title: "Data Structures by Cormen (CLRS)", description: "3rd edition, good condition.", condition: "GOOD", askingPrice: 1200, images: ["https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600"] },
  ],
  "fiction": [
    { title: "The Alchemist - Paulo Coelho", description: "Paperback, read once.", condition: "LIKE_NEW", askingPrice: 200, images: ["https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600"] },
    { title: "Harry Potter Complete Series", description: "All 7 books, hardcover set.", condition: "GOOD", askingPrice: 3500, images: ["https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600"] },
  ],
  "non-fiction": [
    { title: "Atomic Habits - James Clear", description: "Paperback, like new.", condition: "LIKE_NEW", askingPrice: 350, images: ["https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600"] },
  ],
  // Sports & Fitness
  "gym-equipment": [
    { title: "Adjustable Dumbbell Set (5-25kg)", description: "Rubber coated, with stand. Used for 6 months.", condition: "GOOD", askingPrice: 8500, images: ["https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600"] },
    { title: "Yoga Mat Premium 6mm", description: "Non-slip, with carry strap. Used twice.", condition: "LIKE_NEW", askingPrice: 900, images: ["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600"] },
  ],
  "outdoor-sports": [
    { title: "Badminton Racket Set", description: "2 Yonex rackets + shuttlecocks + bag.", condition: "GOOD", askingPrice: 2800, images: ["https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600"] },
  ],
  "cycles-skating": [
    { title: "Inline Skates Size 8", description: "Rollerblade brand, used 10 times.", condition: "GOOD", askingPrice: 3200, images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"] },
  ],
  // Beauty & Personal Care
  "skincare": [
    { title: "The Ordinary Skincare Bundle", description: "Niacinamide, Hyaluronic Acid, AHA/BHA. All sealed.", condition: "NEW", askingPrice: 1800, images: ["https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600"] },
  ],
  "makeup": [
    { title: "MAC Lipstick Collection (5 pcs)", description: "All lightly used, sanitized.", condition: "GOOD", askingPrice: 2500, images: ["https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600"] },
  ],
  "hair-care": [
    { title: "Dyson Supersonic Hair Dryer", description: "1 year old, works perfectly. With all attachments.", condition: "GOOD", askingPrice: 18000, images: ["https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600"] },
  ],
  // Home & Kitchen
  "cookware": [
    { title: "Prestige Non-Stick Cookware Set", description: "5-piece set. Used for 6 months, no scratches.", condition: "GOOD", askingPrice: 3200, images: ["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600"] },
  ],
  "bedding-linen": [
    { title: "King Size Comforter Set", description: "Grey, 6-piece set. Washed and ready.", condition: "GOOD", askingPrice: 2800, images: ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600"] },
  ],
  "home-decor": [
    { title: "Macrame Wall Hanging", description: "Handmade, 60cm wide. Boho style.", condition: "NEW", askingPrice: 1200, images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"] },
    { title: "Set of 3 Ceramic Vases", description: "White matte finish. Never used.", condition: "NEW", askingPrice: 950, images: ["https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=600"] },
  ],
};

async function main() {
  // Seed categories
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

  // Seed demo seller
  const demoSeller = await prisma.user.upsert({
    where: { email: "demo@marketiq.com" },
    update: {},
    create: {
      name: "MarketIQ Demo",
      email: "demo@marketiq.com",
      passwordHash: await bcrypt.hash("Demo@1234", 10),
      role: "SELLER",
    },
  });
  console.log(`Demo seller: ${demoSeller.email}`);

  // Seed sample listings
  let listingCount = 0;
  for (const [slug, products] of Object.entries(SAMPLE_PRODUCTS)) {
    const category = await prisma.category.findUnique({ where: { slug } });
    if (!category) { console.warn(`Category not found: ${slug}`); continue; }

    for (const product of products) {
      const existing = await prisma.listing.findFirst({
        where: { title: product.title, sellerId: demoSeller.id },
      });
      if (existing) continue;

      const listing = await prisma.listing.create({
        data: {
          sellerId: demoSeller.id,
          categoryId: category.id,
          title: product.title,
          description: product.description,
          condition: product.condition,
          askingPrice: product.askingPrice,
          images: {
            create: product.images.map((url, i) => ({ url, sortOrder: i })),
          },
        },
      });
      listingCount++;
    }
  }

  console.log(`Seeded ${listingCount} sample listings.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
