import { Redis } from "@upstash/redis";

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

const TTL_SECONDS = 3600; // 1 hour

interface CachedResponse {
  status: number;
  body: unknown;
}

export async function getIdempotencyResponse(
  key: string,
): Promise<CachedResponse | null> {
  if (!redis) return null;
  try {
    return await redis.get<CachedResponse>(`idempotency:${key}`);
  } catch {
    return null;
  }
}

export async function setIdempotencyResponse(
  key: string,
  response: CachedResponse,
): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(`idempotency:${key}`, response, { ex: TTL_SECONDS });
  } catch {
    // fail silently
  }
}

export function getIdempotencyKey(request: Request): string | null {
  return request.headers.get("Idempotency-Key") ?? null;
}
