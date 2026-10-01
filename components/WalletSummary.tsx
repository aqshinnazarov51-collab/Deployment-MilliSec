import Link from "next/link";
import { WalletCards } from "lucide-react";
import { db } from "@/lib/db";
import { formatUsd } from "@/lib/wallet-money";

export async function WalletSummary({ userId }: { userId: string }) {
  const wallet = await db.wallet.findUnique({ where: { userId }, include: { transactions: { orderBy: { createdAt: "desc" }, take: 4 } } });
  const balance = wallet?.balanceCents ?? 0;
  return <section className="panel" aria-labelledby="wallet-summary-title">
    <div className="page-title-row" style={{ marginBottom: 12 }}>
      <div><div className="eyebrow"><WalletCards size={14} /> Account balance</div><h2 id="wallet-summary-title" style={{ fontSize: 22, margin: "5px 0" }}>Wallet</h2></div>
      <strong style={{ fontSize: 25 }}>{formatUsd(balance)}</strong>
    </div>
    <Link href="/student/wallet/top-up" className="button button-small">Top up wallet</Link>
    <div style={{ marginTop: 18 }}><strong style={{ fontSize: 13 }}>Recent activity</strong>
      {wallet?.transactions.length ? <div style={{ display: "grid", gap: 8, marginTop: 9 }}>{wallet.transactions.map((item) => <div key={item.id} className="course-row" style={{ justifyContent: "space-between", fontSize: 12 }}><span>{item.description}<small>{item.createdAt.toLocaleString()} · balance {formatUsd(item.balanceAfterCents)}{item.status !== "COMPLETED" ? ` · ${item.status.toLowerCase()}` : ""}</small></span><strong>{item.status !== "COMPLETED" ? "—" : item.type === "COURSE_PAYMENT" ? "−" : "+"}{item.status === "COMPLETED" ? formatUsd(item.amountCents) : ""}</strong></div>)}</div> : <p className="small-note" style={{ margin: "8px 0" }}>No wallet activity yet.</p>}
    </div>
    <Link href="/student/wallet" className="text-link" style={{ display: "inline-block", marginTop: 12 }}>View wallet history →</Link>
  </section>;
}
