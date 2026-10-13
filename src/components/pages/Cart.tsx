import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, X, ShoppingBag, Tag, ArrowRight, Trash2 } from "lucide-react";
import { ProductVisual } from "@/components/ProductVisual";
import { DialEyebrow } from "@/components/DialEyebrow";
import { useProducts } from "@/context/ProductsContext";
import { useStore, formatINR } from "@/context/StoreContext";
import { useRouter } from "@/context/RouterContext";
import { toast } from "sonner";

export function Cart() {
  const { cart, setQty, removeFromCart, cartSubtotal, cartDiscount, cartShipping, cartTotal, applyCoupon, clearCoupon, appliedCoupon } = useStore();
  const { products, bestPriceFor } = useProducts();
  const { go } = useRouter();
  const [coupon, setCoupon] = useState("");

  const lines = cart
    .map((l) => ({ product: products.find((p) => p.id === l.productId), qty: l.qty }))
    .filter((l): l is { product: (typeof products)[number]; qty: number } => !!l.product);

  const handleApply = () => {
    const res = applyCoupon(coupon);
    if (res.ok) {
      toast.success(res.message);
      setCoupon("");
    } else {
      toast.error(res.message);
    }
  };

  if (lines.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-5 md:px-8 pt-40 pb-32 text-center">
        <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
          <ShoppingBag size={28} className="text-white/30" />
        </div>
        <h1 className="font-display text-2xl text-white mb-2">Your bag is empty.</h1>
        <p className="text-white/45 text-sm mb-8">Pieces you add will appear here, ready when you are.</p>
        <button
          onClick={() => go("shop")}
          className="inline-flex items-center gap-2 bg-gold text-[#0F0F10] rounded-full px-7 py-3 text-sm font-semibold uppercase tracking-wide hover:bg-[#e4c25c] transition-colors"
        >
          Shop Collection <ArrowRight size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 pt-28 md:pt-32 pb-24">
      <DialEyebrow hour="IV" label="Your Bag" />
      <h1 className="font-display text-3xl md:text-4xl text-white mb-2 lg:mb-10">Shopping Bag</h1>
      <p className="lg:hidden text-white/30 text-xs mb-8">Swipe an item left to remove it.</p>

      <div className="grid lg:grid-cols-[1fr_360px] gap-10">
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {lines.map(({ product, qty }) => {
              const { price: unitPrice } = bestPriceFor(product);
              return (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -30, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3 }}
                className="relative rounded-[20px] overflow-hidden"
              >
                <div className="lg:hidden absolute inset-0 flex items-center justify-end bg-red-500/90 pr-7">
                  <Trash2 size={18} className="text-white" />
                </div>
                <motion.div
                  drag="x"
                  dragDirectionLock
                  dragConstraints={{ left: -84, right: 0 }}
                  dragElastic={{ left: 0.15, right: 0 }}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -64) removeFromCart(product.id);
                  }}
                  className="relative z-10 flex gap-4 md:gap-6 bg-[#111114] border border-white/[0.06] rounded-[20px] p-4 md:p-5 touch-pan-y"
                >
                <button onClick={() => go("product", { productId: product.id })} className="h-24 w-24 md:h-28 md:w-28 shrink-0 rounded-2xl bg-gradient-to-b from-[#17181C] to-[#0b0b0c] p-3">
                  <ProductVisual product={product} className="w-full h-full" />
                </button>
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] tracking-luxe uppercase text-gold/80 mb-1">{product.line}</p>
                      <button onClick={() => go("product", { productId: product.id })} className="text-white font-display text-base md:text-lg hover:text-gold transition-colors text-left truncate block max-w-[220px] sm:max-w-none">
                        {product.name}
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="text-white/30 hover:text-red-400 transition-colors shrink-0"
                      aria-label="Remove item"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <p className="text-white/40 text-xs mt-1">{product.caseSize} &middot; {product.strapMaterial}</p>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="flex items-center border border-white/15 rounded-full">
                      <button aria-label={`Decrease quantity of ${product.name}`} onClick={() => setQty(product.id, qty - 1)} className="h-8 w-8 flex items-center justify-center text-white/70 hover:text-white">
                        <Minus size={12} />
                      </button>
                      <span className="w-7 text-center text-white text-sm">{qty}</span>
                      <button aria-label={`Increase quantity of ${product.name}`} disabled={qty >= 9} onClick={() => setQty(product.id, qty + 1)} className="h-8 w-8 flex items-center justify-center text-white/70 hover:text-white">
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="text-white font-semibold text-sm md:text-base">{formatINR(unitPrice * qty)}</span>
                  </div>
                </div>
                </motion.div>
              </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="lg:sticky lg:top-28 h-fit bg-[#111114] border border-white/[0.06] rounded-[20px] p-6">
          <h2 className="font-display text-lg text-white mb-5">Order Summary</h2>

          {appliedCoupon ? (
            <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-2.5 mb-5">
              <span className="text-emerald-400 text-xs">{appliedCoupon.title}</span>
              <button aria-label="Remove coupon" onClick={clearCoupon} className="text-white/40 hover:text-white">
                <X size={13} />
              </button>
            </div>
          ) : (
            <div className="flex gap-2 mb-5">
              <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4">
                <Tag size={13} className="text-white/30 shrink-0" />
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="Coupon code"
                  className="w-full bg-transparent py-2.5 text-xs text-white placeholder:text-white/30 outline-none"
                />
              </div>
              <button onClick={handleApply} className="shrink-0 border border-white/15 hover:border-gold/50 rounded-full px-4 text-xs text-white transition-colors">
                Apply
              </button>
            </div>
          )}

          <div className="space-y-3 text-sm mb-5">
            <div className="flex justify-between text-white/60">
              <span>Subtotal</span>
              <span>{formatINR(cartSubtotal)}</span>
            </div>
            {cartDiscount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount</span>
                <span>-{formatINR(cartDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-white/60">
              <span>Shipping</span>
              <span>{cartShipping === 0 ? "Free" : formatINR(cartShipping)}</span>
            </div>
          </div>
          <div className="flex justify-between items-baseline pt-4 border-t border-white/[0.06] mb-6">
            <span className="text-white font-medium">Total</span>
            <span className="text-white font-display text-xl">{formatINR(cartTotal)}</span>
          </div>

          <button
            onClick={() => go("checkout")}
            className="w-full flex items-center justify-center gap-2 bg-gold text-[#0F0F10] rounded-full py-3.5 text-sm font-semibold uppercase tracking-wide hover:bg-[#e4c25c] transition-colors"
          >
            Proceed to Checkout <ArrowRight size={15} />
          </button>
          <p className="text-center text-white/30 text-xs mt-4">Cash on Delivery only — pay when it arrives.</p>
        </div>
      </div>
    </div>
  );
}
