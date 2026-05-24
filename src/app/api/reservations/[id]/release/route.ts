import { prisma } from "@/lib/prisma";
import { releaseReservation } from "@/lib/reservation";
import { errorResponse } from "@/lib/errors";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const reservation = await prisma.$transaction(async (tx) => {
      return await releaseReservation(tx, id);
    });

    return Response.json({
      id: reservation.id,
      status: "RELEASED",
      message: "Reservation released successfully",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
