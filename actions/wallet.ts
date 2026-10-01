"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { processPayment } from "@/lib/services/mockPayment";
import { isIdempotencyKey, parseUsdToCents } from "@/lib/wallet-money";

export async function depositWallet(form: FormData) {
  const user = await requireUser();
  const amountText = String(form.get("topUpAmount") ?? "");
  const amountCents = parseUsdToCents(amountText);
  const key = String(form.get("idempotencyKey") ?? "");
  if (amountCents === null || amountCents < 100 || amountCents > 1_000_000 || !isIdempotencyKey(key)) {
    redirect("/student/wallet/top-up?error=Invalid+top-up+request");
  }

  const existing = await db.walletTransaction.findUnique({ where: { idempotencyKey: key } });
  if (existing) {
    if (existing.userId === user.id && existing.type === "DEPOSIT" && existing.status === "COMPLETED") {
      revalidatePath("/student/wallet");
      redirect("/student/wallet?success=1");
    }
    redirect("/student/wallet/top-up?error=This+payment+attempt+was+already+processed.+Reload+to+try+again");
  }

  const payment = await processPayment({
    number: String(form.get("cardNumber") ?? ""),
    expiry: String(form.get("expiry") ?? ""),
    cvv: String(form.get("cvv") ?? ""),
    holder: String(form.get("holder") ?? ""),
  });
  const paymentTransactionId = payment.transactionId || null;

  try {
    await db.$transaction(async (tx) => {
      const wallet = await tx.wallet.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} });
      const balanceBeforeCents = wallet.balanceCents;
      const balanceAfterCents = payment.success ? balanceBeforeCents + amountCents : balanceBeforeCents;
      if (payment.success) {
        await tx.wallet.update({ where: { id: wallet.id }, data: { balanceCents: { increment: amountCents } } });
      }
      await tx.walletTransaction.create({ data: {
        walletId: wallet.id,
        userId: user.id,
        type: "DEPOSIT",
        amountCents,
        balanceBeforeCents,
        balanceAfterCents,
        description: payment.success ? "Wallet top-up by demo card" : "Declined wallet top-up by demo card",
        status: payment.success ? "COMPLETED" : "FAILED",
        idempotencyKey: key,
        paymentTransactionId,
      } });
    });
  } catch (error) {
    // A unique-key race means another request already completed this exact form submission.
    const duplicate = await db.walletTransaction.findUnique({ where: { idempotencyKey: key } });
    if (duplicate?.userId === user.id && duplicate.type === "DEPOSIT" && duplicate.status === "COMPLETED") {
      revalidatePath("/student/wallet");
      redirect("/student/wallet?success=1");
    }
    throw error;
  }

  revalidatePath("/student/wallet");
  revalidatePath("/student/profile");
  if (!payment.success) redirect("/student/wallet/top-up?amount=" + encodeURIComponent(amountText) + "&error=Card+payment+was+declined.+Your+balance+was+not+changed");
  redirect("/student/wallet?success=1");
}

