"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession, requireUser } from "@/lib/auth";
import { emailSchema, passwordSchema, passwordUsesAccountInfo } from "@/lib/validation";

export async function updateProfile(form:FormData){
  const user=await requireUser(),firstName=String(form.get("firstName")??"").trim(),lastName=String(form.get("lastName")??"").trim(),username=String(form.get("username")??"").trim();
  const email=emailSchema.safeParse(form.get("email"));
  const website=val(form,"website"),phone=val(form,"phone"),bio=val(form,"bio"),city=val(form,"city"),country=val(form,"country"),socialLinks=val(form,"socialLinks"),tooLong=(value:string|null,limit:number)=>Boolean(value&&value.length>limit);
  const profilePath=user.role==="INSTRUCTOR"?"/instructor/profile":"/student/profile";
  if(!firstName||firstName.length>50||!lastName||lastName.length>50||username.length<3||username.length>30||!/^[a-zA-Z0-9_.-]+$/.test(username)||!email.success||(website&&!zodUrl(website))||tooLong(phone,30)||tooLong(bio,1000)||tooLong(city,100)||tooLong(country,100)||tooLong(website,200)||tooLong(socialLinks,1000)) redirect(`${profilePath}?error=Check+the+required+fields`);
  try{await db.user.update({where:{id:user.id},data:{firstName,lastName,username,email:email.data,profile:{upsert:{create:{phone:val(form,"phone"),bio:val(form,"bio"),city:val(form,"city"),country:val(form,"country"),website:val(form,"website"),socialLinks:val(form,"socialLinks")},update:{phone:val(form,"phone"),bio:val(form,"bio"),city:val(form,"city"),country:val(form,"country"),website:val(form,"website"),socialLinks:val(form,"socialLinks")}}}}});}catch{redirect(user.role==="INSTRUCTOR"?"/instructor/profile?error=Email+or+username+already+in+use":"/student/profile?error=Email+or+username+already+in+use");}
  revalidatePath("/");redirect(user.role==="INSTRUCTOR"?"/instructor/profile?saved=1":"/student/profile?saved=1");
}
export async function updateSettings(form:FormData){
  const user=await requireUser(),theme=String(form.get("theme")??"light");
  const path=user.role==="INSTRUCTOR"?"/instructor/settings":"/student/settings";
  if(!["light","dark"].includes(theme))redirect(`${path}?error=Invalid+theme`);
  await db.userSettings.upsert({where:{userId:user.id},create:{userId:user.id,theme,...prefs(form)},update:{theme,...prefs(form)}});
  revalidatePath(path);redirect(`${path}?saved=1`);
}
export async function updateThemePreference(form:FormData){
  const user=await requireUser(),theme=String(form.get("theme")??"light");
  if(!["light","dark"].includes(theme))return;
  await db.userSettings.upsert({where:{userId:user.id},create:{userId:user.id,theme},update:{theme}});
  revalidatePath("/");
}
export async function changePassword(form:FormData){
  const user=await requireUser(),current=String(form.get("currentPassword")??""),next=String(form.get("newPassword")??""),confirm=String(form.get("confirmPassword")??"");
  const path=user.role==="INSTRUCTOR"?"/instructor/settings":"/student/settings";
  const parsed=passwordSchema.safeParse(next);
  if(!parsed.success) redirect(`${path}?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  if(passwordUsesAccountInfo(parsed.data,[user.email,user.username,user.firstName,user.lastName])) redirect(`${path}?error=${encodeURIComponent("Do not include your name, username, or email in your password")}`);
  if(next!==confirm) redirect(`${path}?error=${encodeURIComponent("Passwords do not match")}`);
  const credential=await db.user.findUnique({where:{id:user.id},select:{passwordHash:true}});
  if(!credential||!await bcrypt.compare(current,credential.passwordHash)) redirect(`${path}?error=Current+password+is+incorrect`);
  await db.$transaction(async tx=>{
    await tx.user.update({where:{id:user.id},data:{passwordHash:await bcrypt.hash(parsed.data,12)}});
    await tx.session.deleteMany({where:{userId:user.id}});
  });
  await createSession(user.id);
  redirect(`${path}?saved=Password+updated`);
}
function val(f:FormData,k:string){const v=String(f.get(k)??"").trim();return v||null;}
function prefs(f:FormData){return {emailNotifications:f.get("emailNotifications")==="on",courseUpdates:f.get("courseUpdates")==="on",promotions:f.get("promotions")==="on",securityAlerts:f.get("securityAlerts")==="on"};}
function zodUrl(value:string){try{const url=new URL(value);return url.protocol==="http:"||url.protocol==="https:";}catch{return false;}}
