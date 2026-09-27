"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
export async function toggleUserBlock(form:FormData){const admin=await requireUser("ADMIN"),userId=String(form.get("userId")??"");if(userId===admin.id)redirect("/admin?error=You+cannot+block+your+own+account");const user=await db.user.findUnique({where:{id:userId}});if(!user||user.role==="ADMIN")redirect("/admin?error=This+account+cannot+be+changed");await db.user.update({where:{id:userId},data:{blocked:!user.blocked}});revalidatePath("/admin");}
export async function setCourseVisibility(form:FormData){await requireUser("ADMIN");const courseId=String(form.get("courseId")??""),status=String(form.get("status")??"");if(!["PUBLISHED","HIDDEN"].includes(status))redirect("/admin?error=Invalid+course+status");await db.course.updateMany({where:{id:courseId},data:{status}});revalidatePath("/admin");revalidatePath("/catalog");}
