"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

const PATH="/instructor/promos";

export async function createPromo(form: FormData) {
  const user=await requireUser("INSTRUCTOR");
  const code=String(form.get("code")??"").trim().toUpperCase();
  const discountPercent=Number(form.get("discountPercent"));
  const date=String(form.get("expiresAt")??"").trim();
  if(!/^[A-Z0-9_-]{3,40}$/.test(code)||!Number.isInteger(discountPercent)||discountPercent<1||discountPercent>100)redirect(`${PATH}?error=${encodeURIComponent("Use a 3–40 character code and a discount from 1% to 100%.")}`);
  let expiresAt:Date|null=null;
  if(date){expiresAt=new Date(`${date}T23:59:59.999Z`);if(Number.isNaN(expiresAt.getTime())||expiresAt<=new Date())redirect(`${PATH}?error=${encodeURIComponent("Choose a future expiration date.")}`);}
  try{await db.promoCode.create({data:{code,discountPercent,expiresAt,instructorId:user.id,active:true}});}
  catch(error){if(typeof error==="object"&&error!==null&&"code" in error&&error.code==="P2002")redirect(`${PATH}?error=${encodeURIComponent("That promo code already exists.")}`);throw error;}
  revalidatePath(PATH);revalidatePath("/catalog");redirect(`${PATH}?notice=${encodeURIComponent("Promo code created.")}`);
}

export async function togglePromo(form: FormData) {
  const user=await requireUser("INSTRUCTOR"),id=String(form.get("id")??"");
  const promo=await db.promoCode.findFirst({where:{id,instructorId:user.id}});
  if(!promo)redirect(`${PATH}?error=${encodeURIComponent("Promo code not found.")}`);
  await db.promoCode.update({where:{id},data:{active:!promo.active}});
  revalidatePath(PATH);redirect(PATH);
}

export async function deletePromo(form: FormData) {
  const user=await requireUser("INSTRUCTOR"),id=String(form.get("id")??"");
  await db.promoCode.deleteMany({where:{id,instructorId:user.id}});
  revalidatePath(PATH);redirect(PATH);
}
