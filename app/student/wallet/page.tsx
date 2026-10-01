import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatUsd } from "@/lib/wallet-money";

export default async function WalletPage({searchParams}:{searchParams:Promise<{success?:string}>}){
  const search=await searchParams;
  const user=await requireUser();
  const wallet=await db.wallet.findUnique({where:{userId:user.id},include:{transactions:{orderBy:{createdAt:"desc"},take:100}}});
  const transactions=wallet?.transactions??[];
  return <div className="shell" style={{maxWidth:1000,paddingTop:38,paddingBottom:70}}>
    <div className="eyebrow">Your account</div><h1 style={{fontSize:32,margin:"8px 0"}}>Wallet</h1>
    <section className="panel" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:18,flexWrap:"wrap",marginBottom:22}}>
      <div><span className="small-note">Available balance</span><div style={{fontSize:34,fontWeight:800}}>{formatUsd(wallet?.balanceCents??0)}</div></div>
      <Link href="/student/wallet/top-up" className="button">Top up wallet</Link>
    </section>
    {search.success&&<p className="success-note" role="status" style={{marginBottom:18}}>Payment completed successfully. The wallet balance and history are up to date.</p>}
    <section className="panel"><h2 style={{fontSize:20,marginBottom:14}}>Transaction history</h2>
      {!transactions.length?<div className="empty-state"><strong>No wallet transactions yet</strong>Top up your wallet or use it when you buy a course.</div>:<div style={{overflowX:"auto"}}><table className="data-table"><thead><tr><th>Operation</th><th>Date</th><th>Amount</th><th>Balance after</th><th>Status</th></tr></thead><tbody>{transactions.map(item=>{
        const failed=item.status!=="COMPLETED",sign=item.type==="COURSE_PAYMENT"?"−":"+";
        return <tr key={item.id}><td><strong>{item.type==="DEPOSIT"?"Wallet top-up":"Course payment"}</strong><div className="small-note">{item.description}</div></td><td>{item.createdAt.toLocaleString()}</td><td>{failed?"—":`${sign}${formatUsd(item.amountCents)}`}</td><td>{formatUsd(item.balanceAfterCents)}</td><td><span className={`pill ${failed?"pill-gray":""}`}>{item.status.toLowerCase()}</span></td></tr>;
      })}</tbody></table></div>}
    </section>
  </div>;
}
