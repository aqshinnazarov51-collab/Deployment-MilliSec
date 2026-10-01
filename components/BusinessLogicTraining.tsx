"use client";

import { useState } from "react";

type Course={id:string;title:string;price:number};
export function BusinessLogicTraining({courses}:{courses:Course[]}){
  const [courseId,setCourseId]=useState(courses[0]?.id??""),[discountPercent,setDiscountPercent]=useState("0"),[promoCode,setPromoCode]=useState(""),[busy,setBusy]=useState(false),[result,setResult]=useState<Record<string,unknown>|null>(null),[error,setError]=useState("");
  async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setError("");setResult(null);try{const response=await fetch("/api/training/business-logic-misconfiguration",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({courseId,discountPercent:Number(discountPercent),promoCode})});const data=await response.json();if(!response.ok)setError(data.error??"Request failed");else setResult(data);}catch{setError("Request failed");}finally{setBusy(false);}}
  return <section className="panel" style={{padding:24}}>
    <h2 style={{fontSize:20,marginBottom:12}}>Training purchase request</h2>
    <form onSubmit={submit}>
      <div className="field"><label htmlFor="training-course">Course</label><select id="training-course" value={courseId} onChange={event=>setCourseId(event.target.value)}>{courses.map(course=><option key={course.id} value={course.id}>{course.title} · ${course.price.toFixed(2)}</option>)}</select></div>
      <div className="form-grid">
        <div className="field"><label htmlFor="training-discount">Client claimed discount (%)</label><input id="training-discount" type="number" min={0} max={100} step="any" value={discountPercent} onChange={event=>setDiscountPercent(event.target.value)} required/><small>This value is deliberately trusted only in the isolated vulnerable route.</small></div>
        <div className="field"><label htmlFor="training-real-promo">Real promo code for safe comparison (optional)</label><input id="training-real-promo" value={promoCode} onChange={event=>setPromoCode(event.target.value)} placeholder="NEW50" /></div>
      </div>
      <button className="button" disabled={busy||!courseId}>{busy?"Submitting…":"Run training scenario"}</button>
    </form>
    {error&&<p role="alert" className="small-note" style={{color:"#b42318",marginTop:16}}>{error}</p>}
    {result&&<pre role="status" style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",background:"var(--surface-soft, #f5f6fa)",padding:16,borderRadius:12,marginTop:18}}>{JSON.stringify(result,null,2)}</pre>}
  </section>;
}
