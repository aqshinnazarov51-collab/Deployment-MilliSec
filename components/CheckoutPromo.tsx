"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type Quote = { code: string; discountPercent: number; subtotal: number; discountAmount: number; total: number };
type PromoContextValue = { courseIds: string[]; code: string; setCode: (value: string) => void; quote: Quote | null; error: string; busy: boolean; apply: () => Promise<void>; clear: () => void };
const PromoContext = createContext<PromoContextValue | null>(null);

export function CheckoutPromoProvider({ courseIds, children }: { courseIds: string[]; children: React.ReactNode }) {
  const [code, setCode] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const apply = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/promos/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, courseIds }) });
      const result = await response.json();
      if (!response.ok) { setQuote(null); setError(result.error ?? "Promo code could not be applied."); return; }
      setQuote(result);
    } catch { setQuote(null); setError("Promo code could not be checked. Try again."); }
    finally { setBusy(false); }
  }, [code, courseIds]);
  const clear = useCallback(() => { setQuote(null); setError(""); }, []);
  const value = useMemo(() => ({ courseIds, code, setCode, quote, error, busy, apply, clear }), [courseIds, code, quote, error, busy, apply, clear]);
  return <PromoContext.Provider value={value}>{children}</PromoContext.Provider>;
}

export function useCheckoutPromo() {
  const context = useContext(PromoContext);
  if (!context) throw new Error("CheckoutPromoProvider is missing");
  return context;
}

export function PromoCodeInput() {
  const { code, setCode, quote, error, busy, apply, clear } = useCheckoutPromo();
  return <div className="field" style={{ margin: "18px 0" }}>
    <label htmlFor="promo-code">Promo code</label>
    <div style={{ display: "flex", gap: 8 }}>
      <input id="promo-code" value={code} maxLength={40} onChange={(event) => { setCode(event.currentTarget.value.toUpperCase()); clear(); }} placeholder="Enter code" />
      <button type="button" className="button button-outline" onClick={apply} disabled={busy || !code.trim()}>{busy ? "Checking…" : quote ? "Applied ✓" : "Apply"}</button>
    </div>
    {quote && <p className="small-note" role="status">{quote.code} applied · {quote.discountPercent}% discount</p>}
    {error && <p className="small-note" role="alert" style={{ color: "#b42318" }}>{error}</p>}
  </div>;
}

export function PromoCodeFields() {
  const { quote } = useCheckoutPromo();
  return quote ? <input type="hidden" name="promoCode" value={quote.code} /> : null;
}

export function PromoOrderTotal({ baseTotal }: { baseTotal: number }) {
  const { quote } = useCheckoutPromo();
  const subtotal = quote?.subtotal ?? baseTotal;
  const discount = quote?.discountAmount ?? 0;
  const total = quote?.total ?? baseTotal;
  return <>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--muted)" }}><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
    {discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#16804a", marginTop: 8 }}><span>Promo discount</span><span>−${discount.toFixed(2)}</span></div>}
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, marginTop: 12 }}><span>Total due</span><span>${total.toFixed(2)}</span></div>
  </>;
}
