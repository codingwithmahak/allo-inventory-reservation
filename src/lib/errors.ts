export class ReservationError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ReservationError";
  }
}

export function errorResponse(error: unknown, defaultMessage = "Internal server error") {
  if (error instanceof ReservationError) {
    return Response.json(
      { error: error.message },
      { status: error.statusCode },
    );
  }
  const message = error instanceof Error ? error.message : defaultMessage;
  console.error("Unhandled error:", error);
  return Response.json(
    { error: message },
    { status: 500 },
  );
}
