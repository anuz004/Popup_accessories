import { motion } from "framer-motion";
import { Check, ArrowRight, Package, Copy } from "lucide-react";
import { ProductVisual } from "@/components/ProductVisual";
import { formatINR } from "@/context/StoreContext";
import { useRouter } from "@/context/RouterContext";
import { toast } from "sonner";

export function OrderSuccess() {
  const { lastOrder: order, go } = useRouter();

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-5 md:px-8 pt-40 pb-32 text-center">
        <h1 className="font-display text-2xl text-white mb-4">No recent order found.</h1>
        <button onClick={() => go("shop")} className="text-gold underline underline-offset-4">Continue shopping</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 pt-32 md:pt-40 pb-24 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="h-20 w-20 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center mx-auto mb-6"
      >
        <motion.div initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3, duration: 0.5 }}>
          <Check size={34} className="text-gold" strokeWidth={2.5} />
        </motion.div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h1 className="font-display text-3xl md:text-4xl text-white mb-3">Your order has been placed successfully.</h1>
        <p className="text-white/50 text-sm mb-8">
          Thank you, {order.address.firstName}. We're preparing your pieces for dispatch — pay by cash when it arrives.
        </p>

        <div className="inline-flex items-center gap-3 bg-[#111114] border border-white/[0.08] rounded-full px-6 py-3 mb-10">
          <span className="text-white/40 text-xs uppercase tracking-wide">Order ID</span>
          <span className="text-gold font-medium">{order.id}</span>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(order.id);
              toast.success("Order ID copied");
            }}
            className="text-white/40 hover:text-white transition-colors"
            aria-label="Copy order ID"
          >
            <Copy size={13} />
          </button>
        </div>

        <div className="bg-[#111114] border border-white/[0.06] rounded-[20px] p-6 text-left mb-8">
          <div className="flex items-center gap-2 mb-5 text-white">
            <Package size={16} className="text-gold" />
            <span className="text-sm font-medium">Order Summary</span>
            <span className="ml-auto text-xs bg-gold/15 text-gold px-2.5 py-1 rounded-full uppercase tracking-wide">{order.status}</span>
          </div>
          <div className="space-y-4 mb-5">
            {order.items.map(({ product, qty, unitPrice }) => (
              <div key={product.id} className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 rounded-lg bg-gradient-to-b from-[#17181C] to-[#0b0b0c] p-1.5">
                  <ProductVisual product={product} className="w-full h-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{product.name}</p>
                  <p className="text-white/40 text-xs">Qty {qty}</p>
                </div>
                <span className="text-white/80 text-sm">{formatINR(unitPrice * qty)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 text-sm border-t border-white/[0.06] pt-4">
            <div className="flex justify-between text-white/55"><span>Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-emerald-400"><span>Discount</span><span>-{formatINR(order.discount)}</span></div>}
            <div className="flex justify-between text-white/55"><span>Shipping</span><span>{order.shipping === 0 ? "Free" : formatINR(order.shipping)}</span></div>
            <div className="flex justify-between text-white font-medium pt-2 border-t border-white/[0.06]"><span>Total (COD)</span><span>{formatINR(order.total)}</span></div>
          </div>
          <div className="mt-5 pt-5 border-t border-white/[0.06] text-sm text-white/55">
            <p className="text-white/35 text-xs uppercase tracking-wide mb-1">Delivering to</p>
            <p>{order.address.firstName} {order.address.lastName} &middot; {order.address.phone}</p>
            <p>{order.address.address}, {order.address.city}, {order.address.state} {order.address.pincode}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => go("shop")}
            className="inline-flex items-center justify-center gap-2 bg-gold text-[#0F0F10] rounded-full px-7 py-3 text-sm font-semibold uppercase tracking-wide hover:bg-[#e4c25c] transition-colors"
          >
            Continue Shopping <ArrowRight size={15} />
          </button>
          <button
            onClick={() => go("home")}
            className="inline-flex items-center justify-center gap-2 border border-white/20 text-white rounded-full px-7 py-3 text-sm font-medium uppercase tracking-wide hover:border-gold/50 hover:text-gold transition-colors"
          >
            Back to Home
          </button>
        </div>
      </motion.div>
    </div>
  );
}
