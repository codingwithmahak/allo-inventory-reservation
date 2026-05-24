import { prisma } from "@/lib/prisma";
import { reserveUnits, type ReserveInput } from "@/lib/reservation";
import { ReservationError, errorResponse } from "@/lib/errors";
import {
  getIdempotencyKey,
  getIdempotencyResponse,
  setIdempotencyResponse,
} from "@/lib/idempotency";
import { z } from "zod";

const reserveSchema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export async function POST(request: Request) {
  const idempotencyKey = getIdempotencyKey(request);

  try {
    if (idempotencyKey) {
      const cached = await getIdempotencyResponse(idempotencyKey);
      if (cached) {
        return Response.json(cached.body, { status: cached.status });
      }
    }

    const body: unknown = await request.json();
    const parsed = reserveSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const input: ReserveInput = parsed.data;

    const reservation = await prisma.$transaction(async (tx) => {
      return await reserveUnits(tx, input);
    });

    const responseBody = {
      id: reservation.id,
      productId: reservation.productId,
      warehouseId: reservation.warehouseId,
      quantity: reservation.quantity,
      status: reservation.status,
      expiresAt: reservation.expiresAt.toISOString(),
      createdAt: reservation.createdAt.toISOString(),
    };

    if (idempotencyKey) {
      await setIdempotencyResponse(idempotencyKey, {
        status: 201,
        body: responseBody,
      });
    }

    return Response.json(responseBody, { status: 201 });
  } catch (error) {
    if (error instanceof ReservationError && idempotencyKey) {
      await setIdempotencyResponse(idempotencyKey, {
        status: error.statusCode,
        body: { error: error.message },
      });
    }
    return errorResponse(error);
  }
}
