# Allo Inventory — Reservation System

A concurrency-safe inventory reservation system for multi-warehouse checkout flows.

This project solves the checkout race condition where payment confirmation may take several minutes while inventory remains visible to other shoppers.

When a customer begins checkout, inventory is **reserved for 10 minutes**. If payment succeeds, the reservation is confirmed and stock is permanently decremented. If payment fails, is cancelled, or expires, the reservation is released automatically.

**Live Demo:** https://allo-inventory-opal.vercel.app

---

# Running locally

## Prerequisites

- Node.js 18+
- npm
- Hosted PostgreSQL database (Supabase / Neon / Railway)
- Upstash Redis account (for idempotency caching)

---

## 1. Clone and install

```bash
git clone <repo-url>
cd allo-inventory
npm install
```

---

## 2. Configure environment variables

Copy:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token |

Example:

```env
DATABASE_URL="postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres"
UPSTASH_REDIS_REST_URL="https://xxxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="xxxx"
```

For production on Vercel, use the pooled connection string (`pgbouncer=true`).

---

## 3. Run migrations

```bash
npm run db:migrate
```

---

## 4. Seed database

```bash
npm run db:seed
```

---

## 5. Start development server

```bash
npm run dev
```

Open:

http://localhost:3000

---

# Architecture

## Data model

```text
Product ──┐
          ├── Stock ─── Warehouse
          │    (total, reserved)
          │
Reservation ──┘
   status: PENDING | CONFIRMED | RELEASED
   expiresAt
   confirmedAt
   releasedAt
```

### Constraints

- `Stock(productId, warehouseId)` unique constraint
- Indexed reservations by `(status, expiresAt)` for expiry cleanup
- Idempotent responses cached in Redis with TTL expiry

---

# Reservation flow

## Reserve

`POST /api/reservations`

Inside a PostgreSQL transaction:

1. Lock stock row using `SELECT ... FOR UPDATE`
2. Compute available inventory (`total - reserved`)
3. If insufficient → return `409 Conflict`
4. Increment reserved count
5. Create `PENDING` reservation with expiry timestamp

Because the stock row is locked, concurrent reservations for the final unit are serialized.

If two simultaneous requests compete for the last unit, exactly one succeeds and the second receives `409`.

---

## Confirm

`POST /api/reservations/:id/confirm`

Transaction steps:

1. Lock reservation row
2. Validate reservation is still pending
3. Validate reservation has not expired
4. Mark reservation `CONFIRMED`
5. Decrement reserved stock

Returns:

- `200` success
- `410 Gone` if expired
- `409 Conflict` if already released

---

## Release

`POST /api/reservations/:id/release`

Transaction steps:

1. Lock reservation row
2. Validate pending state
3. Mark `RELEASED`
4. Decrement reserved stock

Returns:

- `200` success
- `410` expired
- `409` already confirmed

---

# Concurrency correctness

The critical requirement is preventing oversell when multiple users reserve the same SKU simultaneously.

This is handled using **PostgreSQL row-level locks (`FOR UPDATE`) inside interactive Prisma transactions**.

Concurrent reservations against the same stock row are serialized by the database:

- First request acquires lock
- Second request waits
- First updates reserved inventory
- Second re-checks availability after lock release

This removes the race window between checking availability and updating stock.

---

# Reservation expiry

Expired reservations are automatically released using two mechanisms.

## 1. Lazy cleanup (primary)

Every `GET /api/products` request runs expiry cleanup inside a transaction:

- Find expired pending reservations
- Lock them
- Mark released
- Decrement reserved stock

This guarantees inventory consistency without requiring always-on workers.

---

## 2. Vercel cron (safety net)

`/api/cron/release-expired`

Runs daily via Vercel Cron to clean up reservations even during low traffic periods.

---

## Tradeoff

Product availability may appear slightly stale between reads, but reservation correctness is always guaranteed because reservation endpoints re-check state inside transactions.

---

# Idempotency (bonus)

Implemented for:

- `POST /api/reservations`
- `POST /api/reservations/:id/confirm`

Clients send:

```http
Idempotency-Key: <uuid>
```

Flow:

1. Check Redis for cached response
2. If found → return cached result
3. Otherwise execute request
4. Cache response for 1 hour

This makes retries safe during network failures and prevents duplicate reservations or confirmations.

Error responses (`409`, `410`) are cached as well.

---

# API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/products` | List products with available stock |
| GET | `/api/warehouses` | List warehouses |
| POST | `/api/reservations` | Reserve stock |
| GET | `/api/reservations/:id` | Get reservation |
| POST | `/api/reservations/:id/confirm` | Confirm reservation |
| POST | `/api/reservations/:id/release` | Release reservation |
| GET | `/api/cron/release-expired` | Cleanup expired reservations |

---

# Trade-offs and future improvements

Given more time, I would add:

## Automated concurrency tests

Parallel integration tests verifying only one reservation succeeds under contention.

---

## Authentication

Associate reservations with authenticated users.

---

## Rate limiting

Protect reservation endpoints from abuse.

---

## Monitoring

Add:

- structured logs
- Sentry error reporting
- reservation conversion metrics

---

## Scalable expiry batching

Current cleanup locks all expired rows at once.

For larger scale, I would switch to batched cleanup using:

- pagination
- `SKIP LOCKED`

---

## Multi-item cart reservations

Current implementation handles single-item reservations.

Production systems would reserve multiple SKUs atomically.

---

# Technical decisions

## Why raw SQL for locking?

Prisma does not expose explicit `FOR UPDATE` row locking through its high-level client API.

Using raw SQL inside Prisma transactions provides precise lock control, which is required for deterministic reservation correctness.

---

## Why pessimistic locking instead of optimistic retries?

Checkout inventory is highly contended for popular products.

Pessimistic locking guarantees correctness immediately without retry loops or version conflicts.

---

# Notes

This implementation prioritizes correctness under concurrency over feature completeness.

The focus was ensuring reservation state transitions are race-condition-free and easy to reason about under concurrent access.
