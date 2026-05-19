import { NextRequest, NextResponse } from "next/server";

/**
 * Returns null if the request is authorized, or a 401 NextResponse otherwise.
 *
 * Accepts either:
 *   - `Authorization: Bearer <CRON_SECRET>`  (used by Vercel Cron)
 *   - `x-cron-secret: <CRON_SECRET>`         (convenient for curl/scripts)
 *
 * If CRON_SECRET is not set in the environment, all requests are rejected;
 * the gate fails closed by design.
 */
export function requireCronAuth(request: NextRequest): NextResponse | null {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 401 },
    );
  }

  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${expected}`) return null;

  const header = request.headers.get("x-cron-secret");
  if (header === expected) return null;

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
