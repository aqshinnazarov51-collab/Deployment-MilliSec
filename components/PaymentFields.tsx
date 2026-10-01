"use client";

import { useState } from "react";

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
  const [cardDigits, setCardDigits] = useState("");
  const formattedCardNumber = cardDigits.replace(/(.{4})/g, "$1 ").trim();

  return (
    <form action={action}>
      {courseId && <input type="hidden" name="courseId" value={courseId} />}
      {courseIds?.map((id) => <input key={id} type="hidden" name="courseIds" value={id} />)}
      <div className="field">
        <label htmlFor="payment-method">Payment method</label>
        <select id="payment-method" disabled defaultValue="mock"><option value="mock">Lumio test card - mock payment</option></select>
      </div>
      <div className="field">
        <label htmlFor="card-holder">Name on card</label>
        <input id="card-holder" name="holder" autoComplete="cc-name" required placeholder="Alex Morgan" />
      </div>
      <div className="field">
        <label htmlFor="card-number">Card number</label>
        <input
          id="card-number"
          name="cardNumber"
          type="text"
          inputMode="numeric"
          autoComplete="cc-number"
          required
          maxLength={19}
          placeholder="1234 5678 9012 3456"
          value={formattedCardNumber}
          onChange={(event) => setCardDigits(event.target.value.replace(/\D/g, "").slice(0, 16))}
          aria-describedby="card-help"
        />
      </div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="card-expiry">Expiry date</label>
          <input id="card-expiry" name="expiry" autoComplete="cc-exp" placeholder="Any value" />
        </div>
        <div className="field">
          <label htmlFor="card-cvv">Security code</label>
          <input id="card-cvv" name="cvv" autoComplete="cc-csc" placeholder="Any value" />
        </div>
      </div>
      <div className="success-note">Demo checkout only - no real payment is processed. Enter any card details to simulate a successful payment.</div>
      <p className="small-note" id="card-help">
        The exact card number <strong>4000000000000002</strong> simulates a declined payment.
      </p>
      <button className="button full">{price === 0 ? "Enroll for free" : `Pay $${price}`}</button>
    </form>
  );
}
