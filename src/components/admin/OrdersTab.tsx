import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Loader2, Package, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatINR } from "@/context/StoreContext";
import { toast } from "sonner";

interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  qty: number;
}

interface OrderRow {
  id: string;
  order_number: string;
  items: OrderItem[];
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  address: string;
  state: string;
  city: string;
  pincode: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status: string;
  created_at: string;
}

const STATUSES = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];

const statusColor: Record<string, string> = {
  Pending: "text-amber-400 border-amber-400/40",
  Confirmed: "text-blue-400 border-blue-400/40",
  Shipped: "text-purple-400 border-purple-400/40",
  Delivered: "text-emerald-400 border-emerald-400/40",
  Cancelled: "text-red-400 border-red-400/40",
};

export function OrdersTab() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("All");
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
      toast.error(`Orders could not be loaded: ${error.message}`);
    } else {
      setRows((data as OrderRow[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (r: OrderRow, status: string) => {
    if (status === r.status || updatingId) return;
    setUpdatingId(r.id);
    const { data, error } = await supabase.from("orders").update({ status }).eq("id", r.id).select("id, status").single();
    setUpdatingId(null);
    if (error || !data) {
      toast.error(error?.message ?? "The order was not updated");
      return;
    }
    setRows((prev) => prev.map((o) => (o.id === r.id ? { ...o, status: data.status } : o)));
    toast.success(`Order ${r.order_number} marked ${data.status}`);
  };

  const filtered = filter === "All" ? rows : rows.filter((r) => r.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl text-white mb-1">Orders</h1>
          <p className="text-white/40 text-sm">{rows.length} orders received</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-white/10 text-white/50 hover:border-white/30 disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          {["All", ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filter === s ? "border-gold text-gold bg-gold/10" : "border-white/10 text-white/50 hover:border-white/30"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-white/40 text-sm py-12 justify-center">
          <Loader2 size={16} className="animate-spin" /> Loading orders…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-10 text-center">
          <p className="text-sm text-red-300">Orders could not be fetched.</p>
          <p className="mt-1 text-xs text-white/35">{error}</p>
          <button onClick={load} className="mt-4 text-xs text-gold underline underline-offset-4">Try again</button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-white/40 text-sm text-center py-12">No orders {filter !== "All" ? `with status "${filter}"` : "yet"}.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => {
            const isOpen = expanded === r.id;
            return (
              <div key={r.id} className="bg-[#111114] border border-white/[0.06] rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : r.id)}
                  className="w-full flex items-center gap-4 p-4 text-left"
                >
                  <span className="h-9 w-9 rounded-full bg-gold/15 flex items-center justify-center text-gold shrink-0">
                    <Package size={15} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm">{r.order_number}</p>
                    <p className="text-white/40 text-xs truncate">
                      {r.first_name} {r.last_name} &middot; {r.phone} &middot; {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <span className="text-white text-sm shrink-0 hidden sm:block">{formatINR(r.total)}</span>
                  <span className={`shrink-0 text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-full border ${statusColor[r.status] ?? "border-white/15 text-white/40"}`}>
                    {r.status}
                  </span>
                  <ChevronDown size={16} className={`shrink-0 text-white/40 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 border-t border-white/[0.06] grid md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-white/35 text-xs uppercase tracking-wide mb-2">Items</p>
                          <div className="space-y-2">
                            {r.items.map((it, i) => (
                              <div key={i} className="flex justify-between text-sm">
                                <span className="text-white/70">{it.name} &times; {it.qty}</span>
                                <span className="text-white/70">{formatINR(it.price * it.qty)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-1 text-xs text-white/50">
                            <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(r.subtotal)}</span></div>
                            {r.discount > 0 && <div className="flex justify-between text-emerald-400"><span>Discount</span><span>-{formatINR(r.discount)}</span></div>}
                            <div className="flex justify-between"><span>Shipping</span><span>{r.shipping === 0 ? "Free" : formatINR(r.shipping)}</span></div>
                            <div className="flex justify-between text-white font-medium pt-1"><span>Total</span><span>{formatINR(r.total)}</span></div>
                          </div>
                        </div>
                        <div>
                          <p className="text-white/35 text-xs uppercase tracking-wide mb-2">Delivery Address</p>
                          <p className="text-sm text-white/70 leading-relaxed">
                            {r.first_name} {r.last_name}<br />
                            {r.phone} &middot; {r.email}<br />
                            {r.address}, {r.city}, {r.state} {r.pincode}
                          </p>
                          <p className="text-white/35 text-xs uppercase tracking-wide mt-4 mb-2">Update Status</p>
                          <div className="flex flex-wrap gap-2">
                            {STATUSES.map((s) => (
                              <button
                                key={s}
                                onClick={() => updateStatus(r, s)}
                                disabled={updatingId === r.id}
                                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                                  r.status === s ? "border-gold text-gold bg-gold/10" : "border-white/10 text-white/50 hover:border-white/30"
                                } disabled:opacity-50`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
