import { createPromo, deletePromo, togglePromo } from "@/actions/promos";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function InstructorPromos({searchParams}:{searchParams:Promise<{error?:string;notice?:string}>}){
  const user=await requireUser("INSTRUCTOR"),search=await searchParams;
  const promos=await db.promoCode.findMany({where:{instructorId:user.id},orderBy:{createdAt:"desc"}});
  return <div className="shell" style={{maxWidth:1000,paddingTop:38,paddingBottom:70}}>
    <div className="eyebrow">Teaching tools</div><h1 style={{fontSize:32,margin:"8px 0"}}>Promo codes</h1>
    <p className="small-note" style={{marginBottom:24}}>Create discounts for your own courses. Prices are checked again on the server when an order is placed.</p>
    {search.error&&<div className="alert" role="alert" style={{marginBottom:16}}>{search.error}</div>}
    {search.notice&&<div className="success-note" role="status" style={{marginBottom:16}}>{search.notice}</div>}
    <section className="panel" style={{padding:24,marginBottom:22}}>
      <h2 style={{fontSize:19,marginBottom:16}}>Create promo code</h2>
      <form action={createPromo}>
        <div className="form-grid">
          <div className="field"><label htmlFor="promo-create-code">Code</label><input id="promo-create-code" name="code" required minLength={3} maxLength={40} pattern="[A-Za-z0-9_-]+" placeholder="NEW50" /></div>
          <div className="field"><label htmlFor="promo-discount">Discount (%)</label><input id="promo-discount" name="discountPercent" type="number" required min={1} max={100} step={1} placeholder="50" /></div>
        </div>
        <div className="field" style={{maxWidth:420}}><label htmlFor="promo-expires">Expires on (optional)</label><input id="promo-expires" name="expiresAt" type="date" /></div>
        <button className="button">Create code</button>
      </form>
    </section>
    <section className="panel" style={{padding:24}}>
      <h2 style={{fontSize:19,marginBottom:16}}>Your promo codes</h2>
      {!promos.length?<p className="small-note">No promo codes yet.</p>:<div style={{display:"grid",gap:12}}>{promos.map(promo=><article key={promo.id} className="course-row" style={{border:"1px solid var(--line)",borderRadius:14,padding:15,alignItems:"center",flexWrap:"wrap"}}>
        <div className="course-row-main"><strong>{promo.code} · {promo.discountPercent}% off</strong><small>{promo.active?"Active":"Inactive"}{promo.expiresAt?` · expires ${promo.expiresAt.toLocaleDateString()}`:" · no expiry"} · used {promo.usedCount} time{promo.usedCount===1?"":"s"}</small></div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <form action={togglePromo}><input type="hidden" name="id" value={promo.id}/><button className="button button-outline">{promo.active?"Disable":"Enable"}</button></form>
          <form action={deletePromo}><input type="hidden" name="id" value={promo.id}/><button className="button button-outline" style={{color:"#b42318"}}>Delete</button></form>
        </div>
      </article>)}</div>}
    </section>
  </div>;
}
