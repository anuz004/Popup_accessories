import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/context/RouterContext";
import { requestApi } from "@/lib/api";
import { formatINR } from "@/context/StoreContext";

interface CustomerOrder { id: string; order_number: string; created_at: string; status: string; total: number; items: { name: string; qty: number }[] }
export function Account() {
  const { session, googleEnabled, loading, connectionError, signOut } = useAuth();
  const { go } = useRouter();
  const customer = session?.role === "customer" ? session : null;
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loginFailed = new URLSearchParams(window.location.hash.split("?")[1] || "").get("error") === "google";
  useEffect(() => {
    let active = true;
    if (!customer) { setOrders([]); return; }
    setOrdersLoading(true);
    requestApi("/customer/orders").then(result => { if (!active) return; setOrders(result.data || []); setError(result.error?.message || null); setOrdersLoading(false); });
    return () => { active = false; };
  }, [customer]);
  return <div className="max-w-4xl mx-auto px-5 pt-32 pb-24">
    <h1 className="font-display text-4xl text-white mb-6">Your Account</h1>
    {loading ? <p className="text-white/50">Loading your account…</p> : !customer ? <div className="rounded-2xl border border-white/10 bg-[#111114] p-7">
      <h2 className="font-display text-2xl mb-3">Sign in and shop</h2>
      <p className="text-white/60 mb-6">Use your Google account to save your orders. Updates from order placement through delivery are sent to your email.</p>
      {(connectionError || loginFailed) && <p role="alert" className="mb-4 text-amber-300">{connectionError || "Google sign-in could not be completed. Please try again."}</p>}
      {googleEnabled ? <a href="/api/auth/google" className="inline-flex rounded-full bg-white px-6 py-3 font-medium text-black hover:bg-white/90">Continue with Google</a> : <><button disabled className="inline-flex rounded-full bg-white/40 px-6 py-3 font-medium text-black cursor-not-allowed">Continue with Google</button><p className="mt-3 text-sm text-gold">Google sign-in is being set up. You can still browse and shop.</p></>}
      <button onClick={() => go("shop")} className="ml-4 text-sm text-gold hover:underline">Shop Now</button>
    </div> : <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8"><div><p className="text-white">{customer.name}</p><p className="text-white/50">{customer.email}</p></div><button onClick={signOut} className="rounded-full border border-white/20 px-5 py-2 text-sm">Sign out</button></div>
      <h2 className="font-display text-2xl mb-3">Your Orders</h2>
      <p className="text-sm text-white/50 mb-6">Order placement and status updates are sent by email.</p>
      {error && <p role="alert" className="text-amber-300 mb-4">{error}</p>}
      {ordersLoading ? <p className="text-white/50">Loading orders…</p> : orders.length === 0 ? <p className="text-white/50">No orders yet. <button onClick={() => go("shop")} className="text-gold">Shop Now</button></p> : <div className="space-y-4">{orders.map(order => <article key={order.id} className="rounded-2xl border border-white/10 bg-[#111114] p-5"><div className="flex flex-wrap justify-between gap-2"><strong>{order.order_number}</strong><span className="text-gold">{order.status}</span></div><p className="mt-2 text-sm text-white/50">{new Date(order.created_at).toLocaleDateString()} · {formatINR(order.total)}</p><p className="mt-3 text-sm text-white/65">{order.items.map(item => `${item.name} × ${item.qty}`).join(", ")}</p></article>)}</div>}
    </>}
  </div>;
}
