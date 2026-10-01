import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { BusinessLogicTraining } from "@/components/BusinessLogicTraining";

export default async function BusinessLogicTrainingPage(){
  if(process.env.NODE_ENV==="production"||process.env.ENABLE_TRAINING_VULNERABILITIES!=="true")notFound();
  const user=await requireUser("STUDENT");
  const courses=await db.course.findMany({where:{status:"PUBLISHED",enrollments:{none:{userId:user.id}}},select:{id:true,title:true,price:true},orderBy:{title:"asc"},take:100});
  return <main className="shell" style={{maxWidth:900,paddingTop:48,paddingBottom:80}}>
    <div className="eyebrow">Authorized local training only</div><h1 style={{fontSize:34,margin:"10px 0"}}>Business Logic Misconfiguration</h1>
    <div role="note" style={{background:"#fff3cd",border:"1px solid #e8c65b",borderRadius:12,padding:15,margin:"18px 0"}}><strong>VULNERABLE / TRAINING</strong><p style={{margin:"6px 0 0"}}>This isolated demo endpoint trusts the discount percentage sent by your browser. It is not available in production, processes no real payment, and should only be used against your local training database.</p></div>
    {courses.length?<BusinessLogicTraining courses={courses}/>:<p className="small-note">No published, unowned courses are available for this exercise.</p>}
    <section className="panel" style={{padding:20,marginTop:18}}><strong>Secure comparison</strong><p className="small-note" style={{marginBottom:0}}>The normal checkout ignores client-supplied percentages, checks that a promo is active and unexpired in the database, verifies the course owner, and recalculates the payable amount on the server.</p></section>
  </main>;
}
