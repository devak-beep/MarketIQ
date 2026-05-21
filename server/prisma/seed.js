import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "Phones", slug: "phones" },
  { name: "Laptops", slug: "laptops" },
  { name: "Furniture", slug: "furniture" },
  { name: "Bikes", slug: "bikes" },
  { name: "Games", slug: "games" },
  { name: "Appliances", slug: "appliances" },
  { name: "Cameras", slug: "cameras" },
  { name: "Books", slug: "books" },
  { name: "Fitness", slug: "fitness" },
  { name: "Accessories", slug: "accessories" },
];

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });
  }

  console.log(`Seeded ${categories.length} categories.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
