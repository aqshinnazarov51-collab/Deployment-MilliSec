import { randomUUID } from "node:crypto";
import Link from "next/link";
import { depositWallet } from "@/actions/wallet";
import { PaymentFields } from "@/components/PaymentFields";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatUsd, parseUsdToCents } from "@/lib/wallet-money";

const presets=[10,25,50,100];
export default async function WalletTopUpPage({searchParams}:{searchParams:Promise<{amount?:string;error?:string;success?:string}>}){
  const [user,search]=await Promise.all([requireUser(),searchParams]);
  const wallet=await db.wallet.findUnique({where:{userId:user.id},select:{balanceCents:true}});
  const amountCents=search.amount?parseUsdToCents(search.amount):null;
  const validAmount=amountCents!==null&&amountCents>=100&&amountCents<=1_000_000;
  const amount=validAmount?search.amount!:"";
  return <main className="shell" style={{maxWidth:800,paddingTop:38,paddingBottom:70}}>
    <div className="eyebrow">Wallet balance · {formatUsd(wallet?.balanceCents??0)}</div><h1 style={{fontSize:32,margin:"8px 0"}}>Top up wallet</h1>
    <p className="small-note" style={{marginBottom:22}}>Demo card payment only. No real payment provider is connected and no card details are saved.</p>
    {search.error&&<div className="alert" role="alert" style={{marginBottom:16}}>{search.error}</div>}
    {search.success&&<div className="success-note" role="status" style={{marginBottom:16}}>Wallet transaction completed. Your current balance is {formatUsd(wallet?.balanceCents??0)}.</div>}
    {!validAmount?<section className="panel"><h2 style={{fontSize:19}}>Choose an amount</h2>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",margin:"16px 0 22px"}}>{presets.map(value=><form key={value} method="get"><input type="hidden" name="amount" value={value}/><button className="button button-outline">${value}</button></form>)}</div>
      <form method="get"><div className="field" style={{maxWidth:360}}><label htmlFor="custom-amount">Custom amount (USD)</label><input id="custom-amount" name="amount" type="number" min="1" max="10000" step="0.01" placeholder="25.00" required/></div><button className="button">Continue</button></form>
      {search.amount&&<p className="small-note" role="alert" style={{color:"#b42318",marginTop:12}}>Choose an amount between $1.00 and $10,000.00, with up to two decimal places.</p>}
    </section>:<>
      <Link href="/student/wallet/top-up" className="text-link">← Choose a different amount</Link>
      <section className="panel" style={{marginTop:14}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}><h2 style={{fontSize:19,margin:0}}>Card payment</h2><strong>{formatUsd(amountCents!)}</strong></div>
        <PaymentFields action={depositWallet} price={Number(amount)} topUpAmount={amount} idempotencyKey={randomUUID()} enablePromo={false}/>
      </section>
    </>}
  </main>;
}
