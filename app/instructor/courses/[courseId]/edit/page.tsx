import { notFound } from "next/navigation";
import { CourseEditor } from "@/components/CourseEditor";
import { Alert } from "@/components/Message";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
export default async function EditCourse({params,searchParams}:{params:Promise<{courseId:string}>;searchParams:Promise<{error?:string}>}){const user=await requireUser("INSTRUCTOR"),{courseId}=await params,[course,categories,p]=await Promise.all([db.course.findFirst({where:{id:courseId,instructorId:user.id},include:{sections:{orderBy:{position:"asc"},include:{lessons:{orderBy:{position:"asc"}}}}}}),db.category.findMany({orderBy:{name:"asc"}}),searchParams]);if(!course)notFound();return <><div className="page-title-row"><div><div className="eyebrow">Keep your course fresh</div><h1>Edit course</h1><p>Make a change, add a lesson, or publish when you’re ready.</p></div></div><Alert error={p.error}/><CourseEditor categories={categories} initial={{...course,sections:course.sections.map(s=>({title:s.title,lessons:s.lessons.map(l=>({title:l.title,description:l.description,videoUrl:l.videoUrl,durationMinutes:l.durationMinutes}))}))}}/></>;}
