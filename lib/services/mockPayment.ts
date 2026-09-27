import { randomInt } from "node:crypto";
export type CardInput = { number:string; expiry:string; cvv:string; holder:string };
export function validateCard(card: CardInput) {
  const number = card.number.replace(/\s/g, "");
  // The local demo accepts only these published sandbox numbers; real card numbers are never collected.
  if (!new Set(["4111111111111111", "4000000000000002"]).has(number) || !card.holder.trim() || !/^\d{2}\/\d{2}$/.test(card.expiry) || !/^\d{3,4}$/.test(card.cvv)) return false;
  const [monthText,yearText]=card.expiry.split("/"),month=Number(monthText),year=2000+Number(yearText);
  if(month<1||month>12||new Date(year,month,0,23,59,59)<new Date())return false;
  return true;
}
export async function processPayment(card: CardInput) {
  if (!validateCard(card)) return { success:false as const, transactionId:"", status:"failed" as const };
  await new Promise(resolve=>setTimeout(resolve, 700));
  if (card.number.replace(/\s/g, "") === "4000000000000002") return { success:false as const, transactionId:generateTransactionId(), status:"failed" as const };
  return { success:true as const, transactionId:generateTransactionId(), status:"completed" as const };
}
export function generateTransactionId() { return `TXN-${new Date().getFullYear()}-${String(randomInt(1, 999999)).padStart(6,"0")}`; }
