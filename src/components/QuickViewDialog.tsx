import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ProductVisual } from "@/components/ProductVisual";
import { RatingStars } from "@/components/RatingStars";
import { formatINR, useStore } from "@/context/StoreContext";
import { useRouter } from "@/context/RouterContext";
import type { Product } from "@/data/products";
import { ShoppingBag, Heart, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { useProducts } from "@/context/ProductsContext";

export function QuickViewDialog({ product, onOpenChange }: { product: Product | null; onOpenChange: (open: boolean) => void }) {
  const { addToCart, toggleWishlist, isWishlisted } = useStore();
  const { go } = useRouter();
  const { bestPriceFor } = useProducts();
  const displayPrice = product ? bestPriceFor(product).price : 0;

  return (
    <Dialog open={!!product} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="bg-[#111114] border-white/10 max-w-3xl p-0 overflow-hidden rounded-[20px]">
        {product && (
          <div className="grid md:grid-cols-2">
            <div className="bg-gradient-to-b from-[#17181C] to-[#0b0b0c] p-10 flex items-center justify-center">
              <ProductVisual product={product} animated className="w-full max-w-[280px]" />
            </div>
            <div className="p-8 flex flex-col">
              <DialogTitle className="sr-only">{product.name}</DialogTitle>
              <p className="text-[11px] tracking-luxe uppercase text-gold/80 mb-2">{product.line} &middot; {product.category}</p>
              <h2 className="font-display text-2xl text-white mb-2">{product.name}</h2>
              <div className="flex items-center gap-2 mb-4">
                <RatingStars rating={product.rating} />
                <span className="text-xs text-white/40">({product.reviews} reviews)</span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed mb-5">{product.short}</p>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-white font-semibold text-xl">{formatINR(displayPrice)}</span>
                {displayPrice < product.price ? <span className="text-white/35 text-sm line-through">{formatINR(product.price)}</span> : product.originalPrice && <span className="text-white/35 text-sm line-through">{formatINR(product.originalPrice)}</span>}
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-white/50 mb-6">
                <div><span className="text-white/30">Movement</span><br />{product.movement}</div>
                <div><span className="text-white/30">Water Resist.</span><br />{product.waterResistance}</div>
                <div><span className="text-white/30">Case Size</span><br />{product.caseSize}</div>
                <div><span className="text-white/30">Strap</span><br />{product.strapMaterial}</div>
              </div>
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => {
                    addToCart(product.id);
                    toast.success(`${product.name} added to cart`);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-gold text-[#0F0F10] rounded-full py-3 text-xs font-semibold uppercase tracking-wide hover:bg-[#e4c25c] transition-colors"
                >
                  <ShoppingBag size={14} /> Add to Cart
                </button>
                <button
                  aria-label={isWishlisted(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                  onClick={() => toggleWishlist(product.id)}
                  className="h-11 w-11 shrink-0 flex items-center justify-center rounded-full border border-white/15 hover:border-gold/50 transition-colors"
                >
                  <Heart size={15} className={isWishlisted(product.id) ? "fill-gold text-gold" : "text-white"} />
                </button>
              </div>
              <button
                onClick={() => {
                  go("product", { productId: product.id });
                  onOpenChange(false);
                }}
                className="flex items-center justify-center gap-1 text-xs text-white/50 hover:text-gold mt-4 transition-colors"
              >
                View full details <ArrowUpRight size={13} />
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
