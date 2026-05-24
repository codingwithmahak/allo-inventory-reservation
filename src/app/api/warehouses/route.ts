import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      orderBy: { name: "asc" },
    });
    return Response.json(warehouses);
  } catch (error) {
    return errorResponse(error);
  }
}
