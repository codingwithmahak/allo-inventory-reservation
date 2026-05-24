import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existingProducts = await prisma.product.count();
  if (existingProducts > 0) {
    console.log("Database already seeded, skipping");
    return;
  }

  const warehouse1 = await prisma.warehouse.create({
    data: { name: "New York", location: "Brooklyn, NY" },
  });

  const warehouse2 = await prisma.warehouse.create({
    data: { name: "Los Angeles", location: "Downtown LA" },
  });

  const product1 = await prisma.product.create({
    data: {
      name: "Classic Cotton T-Shirt",
      sku: "TEE-001",
      price: 29.99,
      stocks: {
        create: [
          { warehouseId: warehouse1.id, total: 50, reserved: 0 },
          { warehouseId: warehouse2.id, total: 30, reserved: 0 },
        ],
      },
    },
  });

  const product2 = await prisma.product.create({
    data: {
      name: "Running Sneakers",
      sku: "SNK-002",
      price: 89.99,
      stocks: {
        create: [
          { warehouseId: warehouse1.id, total: 20, reserved: 0 },
          { warehouseId: warehouse2.id, total: 15, reserved: 0 },
        ],
      },
    },
  });

  const product3 = await prisma.product.create({
    data: {
      name: "Wool Beanie Hat",
      sku: "HAT-003",
      price: 19.99,
      stocks: {
        create: [
          { warehouseId: warehouse1.id, total: 100, reserved: 0 },
          { warehouseId: warehouse2.id, total: 75, reserved: 0 },
        ],
      },
    },
  });

  const product4 = await prisma.product.create({
    data: {
      name: "Leather Wallet",
      sku: "WAL-004",
      price: 49.99,
      stocks: {
        create: [
          { warehouseId: warehouse1.id, total: 1, reserved: 0 },
          { warehouseId: warehouse2.id, total: 0, reserved: 0 },
        ],
      },
    },
  });

  console.log("Seeded products:", [product1.name, product2.name, product3.name, product4.name].join(", "));
  console.log("Seeded warehouses:", [warehouse1.name, warehouse2.name].join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
