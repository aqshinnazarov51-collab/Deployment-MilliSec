import { CourseEditor } from "@/components/CourseEditor";
import { Alert } from "@/components/Message";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
export default async function NewCourse({searchParams}:{searchParams:Promise<{error?:string}>}){await requireUser("INSTRUCTOR");const [categories,p]=await Promise.all([db.category.findMany({orderBy:{name:"asc"}}),searchParams]);return <><div className="page-title-row"><div><div className="eyebrow">Make something good</div><h1>Create a course</h1><p>Give learners a clear path from curious to confident.</p></div></div><Alert error={p.error}/><CourseEditor categories={categories}/></>;}
