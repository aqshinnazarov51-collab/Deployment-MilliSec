"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function completeLesson(form:FormData){
  const user=await requireUser("STUDENT"), lessonId=String(form.get("lessonId")??"");
  const lesson=await db.lesson.findUnique({where:{id:lessonId},include:{section:{include:{course:true}}}});
  if(!lesson) redirect("/student/courses?error=Lesson+not+found");
  const course=lesson.section.course;
  const enrollment=await db.enrollment.findUnique({where:{userId_courseId:{userId:user.id,courseId:course.id}}});
  if(!enrollment) redirect("/catalog?error=Enroll+to+start+learning");
  await db.lessonProgress.upsert({where:{userId_lessonId:{userId:user.id,lessonId}},create:{userId:user.id,lessonId,completed:true,completedAt:new Date()},update:{completed:true,completedAt:new Date()}});
  await db.enrollment.update({where:{id:enrollment.id},data:{lastActivityAt:new Date()}});
  const total=await db.lesson.count({where:{section:{courseId:course.id}}});
  const done=await db.lessonProgress.count({where:{userId:user.id,completed:true,lesson:{section:{courseId:course.id}}}});
  if(total>0&&done>=total){
    const cert=await db.certificate.upsert({where:{userId_courseId:{userId:user.id,courseId:course.id}},create:{userId:user.id,courseId:course.id,certificateCode:`CERT-${Math.random().toString(36).slice(2,8).toUpperCase()}`},update:{}});
    await db.notification.create({data:{userId:user.id,title:"Course completed!",body:`Your certificate for ${course.title} is ready.`}});
    revalidatePath("/student/certificates"); redirect(`/student/certificates/${cert.id}`);
  }
  revalidatePath(`/student/courses/${course.id}`); revalidatePath("/student"); redirect(`/student/courses/${course.id}/learn/${lesson.id}?done=1`);
}
export async function reviewCourse(form:FormData){
  const user=await requireUser("STUDENT"),courseId=String(form.get("courseId")??""),rating=Number(form.get("rating")),text=String(form.get("text")??"").trim();
  const enrollment=await db.enrollment.findUnique({where:{userId_courseId:{userId:user.id,courseId}}});
  if(!enrollment||rating<1||rating>5||!text||text.length>1500) redirect(`/courses/${String(form.get("slug")??"")}?error=Complete+the+course+before+reviewing`);
  await db.review.upsert({where:{userId_courseId:{userId:user.id,courseId}},create:{userId:user.id,courseId,rating,text},update:{rating,text}});
  const course=await db.course.findUnique({where:{id:courseId},select:{slug:true,title:true,instructorId:true}});
  if(course)await db.notification.create({data:{userId:course.instructorId,title:"A new course review",body:`${user.firstName} left a review on ${course.title}.`}});
  revalidatePath(`/courses/${course?.slug}`);revalidatePath("/instructor/reviews");redirect(`/courses/${course?.slug}?reviewed=1`);
}
export async function markNotificationRead(form:FormData){
  const user=await requireUser(),id=String(form.get("notificationId")??"");
  await db.notification.updateMany({where:{id,userId:user.id},data:{readAt:new Date()}}); revalidatePath("/");
}
