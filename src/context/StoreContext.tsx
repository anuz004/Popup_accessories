import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { database } from "@/lib/api";
import { useProducts } from "@/context/ProductsContext";
import type { Product, Offer } from "@/data/products";

export interface CartLine {
  productId: string;
  qty: number;
}

export interface Address {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  state: string;
  city: string;
  pincode: string;
}

export interface Order {
  id: string;
  date: string;
  items: { product: Product; qty: number; unitPrice: number }[];
  address: Address;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status: "Pending" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled";
}

interface StoreState {
  cart: CartLine[];
  wishlist: string[];
  addToCart: (productId: string, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  applyCoupon: (code: string) => { ok: boolean; message: string };
  clearCoupon: () => void;
  appliedCoupon: Offer | null;
  placeOrder: (address: Address) => Promise<{ order: Order | null; error: string | null }>;
  cartCount: number;
  cartSubtotal: number;
  cartDiscount: number;
  cartShipping: number;
  cartTotal: number;
  hydrated: boolean;
}

const StoreContext = createContext<StoreState | null>(null);

// Browser storage with a compatibility fallback for artifact previews.
async function storageGet<T>(key: string): Promise<T | null> {
  try {
    const w = window as any;
    if (w.storage?.get) {
      const res = await w.storage.get(key, false);
      return res ? (JSON.parse(res.value) as T) : null;
    }
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}
async function storageSet(key: string, value: unknown) {
  try {
    const w = window as any;
    if (w.storage?.set) await w.storage.set(key, JSON.stringify(value), false);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore — demo works fine in-memory */
  }
}

function offerIsLive(o: Offer) {
  const now = Date.now();
  if (o.startsAt && new Date(o.startsAt).getTime() > now) return false;
  if (o.endsAt && new Date(o.endsAt).getTime() < now) return false;
  return o.active;
}

const SHIPPING_FEE = 99;
const FREE_SHIPPING_THRESHOLD = 5000;

export function StoreProvider({ children }: { children: ReactNode }) {
  const { products, offers, bestPriceFor } = useProducts();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Offer | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const [c, w] = await Promise.all([
        storageGet<CartLine[]>("popup-accessories:cart"),
        storageGet<string[]>("popup-accessories:wishlist"),
      ]);
      if (c) setCart(c);
      if (w) setWishlist(w);
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (hydrated) storageSet("popup-accessories:cart", cart);
  }, [cart, hydrated]);
  useEffect(() => {
    if (hydrated) storageSet("popup-accessories:wishlist", wishlist);
  }, [wishlist, hydrated]);

  const addToCart = (productId: string, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === productId);
      if (existing) {
        return prev.map((l) => (l.productId === productId ? { ...l, qty: Math.min(9, l.qty + qty) } : l));
      }
      return [...prev, { productId, qty: Math.min(9, Math.max(1, qty)) }];
    });
  };
  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  };
  const setQty = (productId: string, qty: number) => {
    setCart((prev) =>
      qty <= 0 ? prev.filter((l) => l.productId !== productId) : prev.map((l) => (l.productId === productId ? { ...l, qty: Math.min(9, qty) } : l))
    );
  };
  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => (prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]));
  };
  const isWishlisted = (productId: string) => wishlist.includes(productId);

  const cartCount = useMemo(() => cart.reduce((sum, l) => sum + l.qty, 0), [cart]);

  // Subtotal already reflects any automatic (no-code) offers applied per line.
  const cartSubtotal = useMemo(
    () =>
      cart.reduce((sum, l) => {
        const p = products.find((p) => p.id === l.productId);
        if (!p) return sum;
        return sum + bestPriceFor(p).price * l.qty;
      }, 0),
    [cart, products, bestPriceFor]
  );

  const cartDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const eligibleSubtotal = cart.reduce((sum, line) => {
      const product = products.find((p) => p.id === line.productId);
      if (!product) return sum;
      const eligible =
        appliedCoupon.scope === "all" ||
        (appliedCoupon.scope === "category" && appliedCoupon.target === product.category) ||
        (appliedCoupon.scope === "product" && appliedCoupon.target === product.id);
      return eligible ? sum + bestPriceFor(product).price * line.qty : sum;
    }, 0);
    if (appliedCoupon.discountType === "percent") return Math.round(eligibleSubtotal * (appliedCoupon.discountValue / 100));
    return Math.min(eligibleSubtotal, appliedCoupon.discountValue);
  }, [appliedCoupon, cart, products, bestPriceFor]);

  const cartShipping = cartSubtotal > 0 && cartSubtotal - cartDiscount < FREE_SHIPPING_THRESHOLD ? SHIPPING_FEE : 0;
  const cartTotal = cartSubtotal - cartDiscount + cartShipping;

  const applyCoupon = (code: string): { ok: boolean; message: string } => {
    const match = offers.find((o) => o.code && o.code.toUpperCase() === code.trim().toUpperCase());
    if (!match) return { ok: false, message: "Invalid coupon code" };
    if (!offerIsLive(match)) return { ok: false, message: "This coupon has expired" };
    const applies = cart.some((line) => {
      const product = products.find((p) => p.id === line.productId);
      return product && (match.scope === "all" || (match.scope === "category" && match.target === product.category) || (match.scope === "product" && match.target === product.id));
    });
    if (!applies) return { ok: false, message: "This coupon does not apply to the items in your bag" };
    setAppliedCoupon(match);
    return { ok: true, message: `Coupon applied — ${match.title}` };
  };
  const clearCoupon = () => setAppliedCoupon(null);

  const placeOrder = async (address: Address): Promise<{ order: Order | null; error: string | null }> => {
    const items = cart
      .map((l) => ({ product: products.find((p) => p.id === l.productId)!, qty: l.qty }))
      .filter((i) => i.product);
    if (items.length === 0) return { order: null, error: "Your bag is empty." };

    // Prices and discounts are recomputed by the database function. Never trust
    // totals supplied by a browser for an order.
    const { data, error } = await database.rpc("place_order", {
      customer: {
        first_name: address.firstName,
        last_name: address.lastName,
        phone: address.phone,
        email: address.email,
        address: address.address,
        state: address.state,
        city: address.city,
        pincode: address.pincode,
      },
      cart_items: items.map((i) => ({ product_id: i.product.id, qty: i.qty })),
      coupon: appliedCoupon?.code ?? null,
    });

    if (error || !data) {
      return { order: null, error: error?.message ?? "Could not place order. Please try again." };
    }

    const order: Order = {
      id: data.order_number,
      date: data.created_at,
      items: items.map((i) => ({ product: i.product, qty: i.qty, unitPrice: Number(data.items.find((row: any) => row.product_id === i.product.id)?.price ?? i.product.price) })),
      address,
      subtotal: Number(data.subtotal),
      shipping: Number(data.shipping),
      discount: Number(data.discount),
      total: Number(data.total),
      status: data.status,
    };
    clearCart();
    return { order, error: null };
  };

  return (
    <StoreContext.Provider
      value={{
        cart,
        wishlist,
        addToCart,
        removeFromCart,
        setQty,
        clearCart,
        toggleWishlist,
        isWishlisted,
        applyCoupon,
        clearCoupon,
        appliedCoupon,
        placeOrder,
        cartCount,
        cartSubtotal,
        cartDiscount,
        cartShipping,
        cartTotal,
        hydrated,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}
