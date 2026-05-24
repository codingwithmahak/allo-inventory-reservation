import { prisma } from "@/lib/prisma";
import { releaseExpiredReservations } from "@/lib/reservation";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    const count = await prisma.$transaction(async (tx) => {
      return await releaseExpiredReservations(tx);
    });

    return Response.json({
      ok: true,
      released: count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to release expired reservations:", error);
    return Response.json(
      { ok: false, error: "Failed to release expired reservations" },
      { status: 500 },
    );
  }
}
