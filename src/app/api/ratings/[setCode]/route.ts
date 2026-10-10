import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseRatingInput } from "@/lib/ratings/validate";

type Params = { params: Promise<{ setCode: string }> };

/** Save (create or replace) the signed-in user's rating for a set. */
export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Sign in to rate sets" }, { status: 401 });
  }

  const setCode = (await params).setCode.toLowerCase();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = parseRatingInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const set = await prisma.setMetadata.findUnique({
    where: { setCode },
    select: { isSupported: true, releaseDate: true },
  });
  if (!set || !set.isSupported) {
    return NextResponse.json({ error: `Unknown set: ${setCode}` }, { status: 404 });
  }

  // "Current" = released, and no newer set has been released since.
  const now = new Date();
  const newerReleased = await prisma.setMetadata.count({
    where: {
      isSupported: true,
      releaseDate: { gt: set.releaseDate, lte: now },
    },
  });
  const ratedWhileCurrent = set.releaseDate <= now && newerReleased === 0;

  const data = { ...parsed.value, ratedWhileCurrent };
  const rating = await prisma.setRating.upsert({
    where: { userId_setCode: { userId, setCode } },
    create: { userId, setCode, ...data },
    update: data,
    select: { setCode: true, fun: true, experience: true, tags: true },
  });

  return NextResponse.json({ rating });
}

/** Remove the signed-in user's rating for a set. */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Sign in to rate sets" }, { status: 401 });
  }

  const setCode = (await params).setCode.toLowerCase();
  await prisma.setRating.deleteMany({ where: { userId, setCode } });
  return NextResponse.json({ ok: true });
}
