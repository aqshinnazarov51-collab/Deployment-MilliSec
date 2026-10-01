"use client";

import { useState } from "react";
import Link from "next/link";
import { PromoCodeFields, PromoCodeInput, useOptionalCheckoutPromo } from "@/components/CheckoutPromo";
import { formatUsd } from "@/lib/wallet-money";

export function PaymentFields({
  action,
  courseId,
  courseIds,
  price,
  walletBalanceCents,
  topUpAmount,
  idempotencyKey,
  enablePromo = true,
}: {
  action: (formData: FormData) => void | Promise<void>;
  courseId?: string;
  courseIds?: string[];
  price: number;
  walletBalanceCents?: number;
  topUpAmount?: string;
  idempotencyKey?: string;
  enablePromo?: boolean;
}) {
  const promoContext = useOptionalCheckoutPromo();
  const quote = enablePromo ? promoContext?.quote : null;
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "WALLET">("CARD");
  const [cardDigits, setCardDigits] = useState("");
  const formattedCardNumber = cardDigits.replace(/(.{4})/g, "$1 ").trim();
  const total = quote?.total ?? price;
  const useWallet = walletBalanceCents !== undefined && !topUpAmount && paymentMethod === "WALLET";
  const walletInsufficient = useWallet && walletBalanceCents! < Math.round(total * 100);

  return (
    <form action={action}>
      {courseId && <input type="hidden" name="courseId" value={courseId} />}
      {courseIds?.map((id) => <input key={id} type="hidden" name="courseIds" value={id} />)}
      {idempotencyKey && <input type="hidden" name="idempotencyKey" value={idempotencyKey} />}
      {topUpAmount && <input type="hidden" name="topUpAmount" value={topUpAmount} />}
      {enablePromo && promoContext && <><PromoCodeFields /><PromoCodeInput /></>}
      {walletBalanceCents !== undefined && !topUpAmount && <fieldset className="panel" style={{ padding: 15, margin: "16px 0" }}>
        <legend style={{ fontWeight: 700 }}>Payment method</legend>
        <label style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 0" }}><input type="radio" name="paymentMethod" value="CARD" checked={paymentMethod === "CARD"} onChange={() => setPaymentMethod("CARD")} /> Bank card</label>
        <label style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 0" }}><input type="radio" name="paymentMethod" value="WALLET" checked={paymentMethod === "WALLET"} onChange={() => setPaymentMethod("WALLET")} /> Wallet · {formatUsd(walletBalanceCents)}</label>
        {walletInsufficient && <p className="small-note" role="alert" style={{ color: "#b42318", margin: "5px 0" }}>Insufficient wallet funds. <Link href="/student/wallet/top-up" className="text-link">Top up your wallet</Link></p>}
      </fieldset>}
      {!useWallet && <>
        <div className="field">
          <label htmlFor="payment-method">Payment method</label>
          <select id="payment-method" disabled defaultValue="mock"><option value="mock">Lumio test card - mock payment</option></select>
        </div>
        <div className="field">
          <label htmlFor="card-holder">Name on card</label>
          <input id="card-holder" name="holder" autoComplete="cc-name" required placeholder="Alex Morgan" disabled={useWallet} />
        </div>
        <div className="field">
          <label htmlFor="card-number">Card number</label>
          <input id="card-number" name="cardNumber" type="text" inputMode="numeric" autoComplete="cc-number" required={!useWallet} disabled={useWallet} maxLength={19} placeholder="1234 5678 9012 3456" value={formattedCardNumber} onChange={(event) => setCardDigits(event.target.value.replace(/\D/g, "").slice(0, 16))} aria-describedby="card-help" />
        </div>
        <div className="form-grid">
          <div className="field"><label htmlFor="card-expiry">Expiry date</label><input id="card-expiry" name="expiry" autoComplete="cc-exp" placeholder="Any value" disabled={useWallet} /></div>
          <div className="field"><label htmlFor="card-cvv">Security code</label><input id="card-cvv" name="cvv" autoComplete="cc-csc" placeholder="Any value" disabled={useWallet} /></div>
        </div>
        <div className="success-note">Demo checkout only - no real payment is processed. Enter any card details to simulate a successful payment.</div>
        <p className="small-note" id="card-help">The exact card number <strong>4000000000000002</strong> simulates a declined payment.</p>
      </>}
      <button className="button full" disabled={walletInsufficient}>{useWallet ? `Pay with wallet ${formatUsd(Math.round(total * 100))}` : topUpAmount ? `Add ${formatUsd(Math.round(Number(topUpAmount) * 100))} to wallet` : total === 0 ? "Enroll for free" : `Pay $${total.toFixed(2)}`}</button>
    </form>
  );
}
