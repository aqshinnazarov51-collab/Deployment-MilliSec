import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const wallet = await db.wallet.findUnique({
    where: { userId: user.id },
    select: { balanceCents: true, transactions: { orderBy: { createdAt: "desc" }, take: 100, select: {
      id: true, type: true, amountCents: true, balanceBeforeCents: true, balanceAfterCents: true,
      description: true, status: true, createdAt: true,
    } } },
  });
  return NextResponse.json({ balanceCents: wallet?.balanceCents ?? 0, transactions: wallet?.transactions ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
}
