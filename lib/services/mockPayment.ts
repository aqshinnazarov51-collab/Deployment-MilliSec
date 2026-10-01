import { randomInt } from "node:crypto";
export type CardInput = { number:string; expiry:string; cvv:string; holder:string };
export function validateCard(card: CardInput) {
  const digits = card.number.replace(/\s/g, "");
  return /^\d{1,16}$/.test(digits) && card.holder.trim().length > 0;
}
export async function processPayment(card: CardInput) {
  if (!validateCard(card)) return { success:false as const, transactionId:"", status:"failed" as const };
  await new Promise(resolve=>setTimeout(resolve, 700));
  if (card.number.replace(/\s/g, "") === "4000000000000002") return { success:false as const, transactionId:generateTransactionId(), status:"failed" as const };
  return { success:true as const, transactionId:generateTransactionId(), status:"completed" as const };
}
export function generateTransactionId() { return `TXN-${new Date().getFullYear()}-${String(randomInt(1, 999999)).padStart(6,"0")}`; }
