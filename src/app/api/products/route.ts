import { prisma } from "@/lib/prisma";
import { releaseExpiredReservations } from "@/lib/reservation";
import { errorResponse } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$transaction(async (tx) => {
      await releaseExpiredReservations(tx);
    });

    const products = await prisma.product.findMany({
      include: {
        stocks: {
          include: {
            warehouse: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const result = products.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: Number(product.price),
      stocks: product.stocks.map((stock) => ({
        warehouseId: stock.warehouseId,
        warehouseName: stock.warehouse.name,
        total: stock.total,
        reserved: stock.reserved,
        available: stock.total - stock.reserved,
      })),
    }));

    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
