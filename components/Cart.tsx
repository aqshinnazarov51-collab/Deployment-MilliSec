"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Check, Compass, ShoppingCart, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

export type CartItem = { id: string; slug: string; title: string; price: number; cover: string };
const KEY = "lumio_cart_v1";
const CHANGE_EVENT = "lumio-cart-change";

type CartContextValue = {
  items: CartItem[];
  ready: boolean;
  totalPrice: number;
  isInCart: (id: string) => boolean;
  add: (item: CartItem) => void;
  remove: (id: string) => void;
  removeMany: (ids: string[]) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function readStoredCart(): CartItem[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "[]") as CartItem[];
    return [...new Map(value.filter((item) => item?.id).map((item) => [item.id, item])).values()];
  } catch {
    return [];
  }
}

function writeStoredCart(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  const syncFromStorage = useCallback(() => setItems(readStoredCart()), []);

  useEffect(() => {
    let active = true;
    const stored = readStoredCart();
    setItems(stored);
    setReady(true);

    const refreshPrices = async () => {
      if (!stored.length) return;
      try {
        const ids = stored.map((item) => item.id);
        const response = await fetch(`/api/cart?ids=${encodeURIComponent(ids.join(","))}`, { cache: "no-store" });
        if (!response.ok) return;
        const fresh = await response.json() as CartItem[];
        if (!active) return;
        const byId = new Map(fresh.map((item) => [item.id, item]));
        const requestedIds = new Set(ids);
        const updated = readStoredCart().flatMap((item) => {
          if (!requestedIds.has(item.id)) return [item];
          const current = byId.get(item.id);
          return current ? [current] : [];
        });
        writeStoredCart(updated);
        setItems(updated);
      } catch {
        // Keep the saved cart available. The checkout recalculates prices on the server.
      }
    };

    void refreshPrices();
    window.addEventListener("storage", syncFromStorage);
    window.addEventListener(CHANGE_EVENT, syncFromStorage);
    return () => {
      active = false;
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener(CHANGE_EVENT, syncFromStorage);
    };
  }, [syncFromStorage]);

  const add = useCallback((item: CartItem) => {
    const current = readStoredCart();
    if (current.some((course) => course.id === item.id)) return;
    const updated = [...current, item];
    writeStoredCart(updated);
    setItems(updated);
  }, []);

  const removeMany = useCallback((ids: string[]) => {
    const removeIds = new Set(ids);
    const updated = readStoredCart().filter((item) => !removeIds.has(item.id));
    writeStoredCart(updated);
    setItems(updated);
  }, []);

  const remove = useCallback((id: string) => removeMany([id]), [removeMany]);
  const clear = useCallback(() => removeMany(readStoredCart().map((item) => item.id)), [removeMany]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    ready,
    totalPrice: items.reduce((sum, item) => sum + item.price, 0),
    isInCart: (id) => items.some((item) => item.id === id),
    add,
    remove,
    removeMany,
    clear,
  }), [items, ready, add, remove, removeMany, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}

export function AddToCart({ item }: { item: CartItem }) {
  const { add, isInCart: checkInCart } = useCart();
  const isInCart = checkInCart(item.id);

  if (isInCart) {
    return <Link href="/cart" className="button button-quiet button-small cart-add-button" aria-label={`${item.title} is in your cart`}><Check size={13} /> In cart</Link>;
  }

  return <button type="button" className="button button-quiet button-small cart-add-button" onClick={() => add(item)}><ShoppingCart size={13} /> Add to cart</button>;
}

export function CartButton() {
  const { items } = useCart();
  return <Link className="icon-button cart-header-button" href="/cart" aria-label={`Shopping cart, ${items.length} courses`}><ShoppingCart size={17} />{items.length > 0 && <span className="cart-count">{items.length}</span>}</Link>;
}

export function CartPage() {
  const { items, ready, totalPrice, remove, clear } = useCart();
  const checkoutHref = items.length
    ? `/checkout?courseIds=${encodeURIComponent(items.map((item) => item.id).join(","))}`
    : "/catalog";

  return <main className="shell cart-page">
    <div className="eyebrow">Your picks</div>
    <h1>Shopping cart</h1>
    <p className="small-note">Prices are refreshed from the course catalog and checkout uses the same amount.</p>
    {!ready ? <div className="panel cart-loading"><span/><span/><span/></div> : items.length === 0
      ? <div className="panel"><EmptyState icon={Compass} title="Your cart is ready for a good idea" action={{href:"/catalog",label:"Explore courses"}}>Save a course here and come back whenever you’re ready.</EmptyState></div>
      : <div className="cart-layout">
        <section className="panel">{items.map((item) => <div key={item.id} className="cart-row">
          <img src={item.cover} alt={`${item.title} course cover`} />
          <div className="cart-row-info"><Link href={`/courses/${item.slug}`}><strong>{item.title}</strong></Link><span>${item.price.toFixed(2)}</span></div>
          <button className="icon-button" onClick={() => remove(item.id)} aria-label={`Remove ${item.title}`}><Trash2 size={15} /></button>
        </div>)}</section>
        <aside className="panel cart-summary">
          <div className="eyebrow">Order summary</div>
          <div className="cart-total">${totalPrice.toFixed(2)}</div>
          <p className="small-note">{items.length} course{items.length === 1 ? "" : "s"} · one demo checkout</p>
          <div className="small-note" style={{ marginBottom: 13 }}>Complete one test payment for every course in your cart.</div>
          <Link className="button full" href={checkoutHref}>Continue to checkout</Link>
          <button className="text-link cart-clear" onClick={clear}>Clear cart</button>
        </aside>
      </div>}
  </main>;
}

export function CartPurchaseClear({ ids }: { ids: string[] }) {
  const { removeMany } = useCart();
  useEffect(() => { if (ids.length) removeMany(ids); }, [ids, removeMany]);
  return null;
}

export const cartStorageKey = KEY;
