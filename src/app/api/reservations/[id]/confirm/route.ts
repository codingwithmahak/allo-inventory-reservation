import { prisma } from "@/lib/prisma";
import { confirmReservation } from "@/lib/reservation";
import { ReservationError, errorResponse } from "@/lib/errors";
import {
  getIdempotencyKey,
  getIdempotencyResponse,
  setIdempotencyResponse,
} from "@/lib/idempotency";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const idempotencyKey = getIdempotencyKey(request);

  try {
    if (idempotencyKey) {
      const cached = await getIdempotencyResponse(idempotencyKey);
      if (cached) {
        return Response.json(cached.body, { status: cached.status });
      }
    }

    const { id } = await params;

    const reservation = await prisma.$transaction(async (tx) => {
      return await confirmReservation(tx, id);
    });

    const responseBody = {
      id: reservation.id,
      status: "CONFIRMED",
      message: "Reservation confirmed successfully",
    };

    if (idempotencyKey) {
      await setIdempotencyResponse(idempotencyKey, {
        status: 200,
        body: responseBody,
      });
    }

    return Response.json(responseBody);
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
