"use client";

import { useState, type FormEvent } from "react";

export function PaymentFields({
  action,
  courseId,
  courseIds,
  price,
}: {
  action: (formData: FormData) => void | Promise<void>;
  courseId?: string;
  courseIds?: string[];
  price: number;
}) {
  const [number, setNumber] = useState("");
  const [cardError, setCardError] = useState("");
  const formattedNumber = number.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  function checkDemoCard(event: FormEvent<HTMLFormElement>) {
    const digits = number.replace(/\D/g, "");
    if (digits !== "4111111111111111" && digits !== "4000000000000002") {
      event.preventDefault();
      setCardError("For this demo, use one of the test card numbers shown below. No real card can be charged.");
      return;
    }
    setCardError("");
  }

  return (
    <form action={action} onSubmit={checkDemoCard}>
      {courseId && <input type="hidden" name="courseId" value={courseId} />}
      {courseIds?.map((id) => <input key={id} type="hidden" name="courseIds" value={id} />)}
      <div className="field">
        <label htmlFor="payment-method">Payment method</label>
        <select id="payment-method" disabled defaultValue="mock"><option value="mock">Lumio test card - mock payment</option></select>
      </div>
      <div className="field">
        <label htmlFor="card-holder">Name on card</label>
        <input id="card-holder" name="holder" autoComplete="cc-name" required placeholder="Alex Morgan" maxLength={80} />
      </div>
      <div className="field">
        <label htmlFor="card-number">Card number</label>
        <input
          id="card-number"
          name="cardNumber"
          inputMode="numeric"
          autoComplete="cc-number"
          required
          placeholder="4111 1111 1111 1111"
          value={formattedNumber}
          onChange={(event) => { setNumber(event.target.value.replace(/\D/g, "").slice(0, 16)); setCardError(""); }}
          aria-describedby="card-error card-help"
        />
      </div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="card-expiry">Expiry date</label>
          <input id="card-expiry" name="expiry" autoComplete="cc-exp" required placeholder="MM/YY" pattern="(0[1-9]|1[0-2])/[0-9]{2}" maxLength={5} />
        </div>
        <div className="field">
          <label htmlFor="card-cvv">Security code</label>
          <input id="card-cvv" name="cvv" inputMode="numeric" autoComplete="cc-csc" required placeholder="123" pattern="[0-9]{3,4}" minLength={3} maxLength={4} />
        </div>
      </div>
      <div className="success-note">Demo checkout only - no real payment is processed. Use one of the test numbers below.</div>
      {cardError && <p id="card-error" role="alert" style={{ color: "#b74433", background: "#fff0ed", borderRadius: 9, padding: "10px 12px", fontSize: 12 }}>{cardError}</p>}
      <p className="small-note" id="card-help">
        Success: <strong>4111 1111 1111 1111</strong> - any future expiry and 3-digit code<br />
        Simulated decline: <strong>4000 0000 0000 0002</strong>
      </p>
      <button className="button full">{price === 0 ? "Enroll for free" : `Pay $${price}`}</button>
    </form>
  );
}
