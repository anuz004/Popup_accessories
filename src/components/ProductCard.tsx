import { motion } from "framer-motion";
import { Heart, ShoppingBag, Eye } from "lucide-react";
import { ProductVisual } from "@/components/ProductVisual";
import { RatingStars } from "@/components/RatingStars";
import { formatINR, useStore } from "@/context/StoreContext";
import { useRouter } from "@/context/RouterContext";
import type { Product } from "@/data/products";
import { toast } from "sonner";
import { useProducts } from "@/context/ProductsContext";

const badgeStyles: Record<string, string> = {
  New: "bg-gold text-[#0F0F10]",
  Bestseller: "bg-white text-[#0F0F10]",
  Limited: "bg-[#0F0F10] text-gold border border-gold/60",
  "-15%": "bg-red-500/90 text-white",
};

export function ProductCard({ product, index = 0, onQuickView }: { product: Product; index?: number; onQuickView?: (p: Product) => void }) {
  const { addToCart, toggleWishlist, isWishlisted } = useStore();
  const { go } = useRouter();
  const { bestPriceFor } = useProducts();
  const wished = isWishlisted(product.id);
  const { price: displayPrice } = bestPriceFor(product);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: (index % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className="group relative rounded-[20px] bg-[#111114] border border-white/[0.06] overflow-hidden cursor-pointer"
      onClick={() => go("product", { productId: product.id })}
    >
      <div className="relative aspect-square bg-gradient-to-b from-[#17181C] to-[#0b0b0c] overflow-hidden">
        {product.badge && (
          <span
            className={`absolute top-3 left-3 z-10 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full ${badgeStyles[product.badge]}`}
          >
            {product.badge}
          </span>
        )}
        <button
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
            toast(wished ? "Removed from wishlist" : "Added to wishlist", { duration: 1600 });
          }}
          className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center hover:bg-black/60 transition-colors"
        >
          <Heart size={15} className={wished ? "fill-gold text-gold" : "text-white"} />
        </button>

        <motion.div
          className="h-full w-full flex items-center justify-center p-8"
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <ProductVisual product={product} className="w-full h-full drop-shadow-2xl" />
        </motion.div>

        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out flex gap-2 p-3 bg-gradient-to-t from-black/80 to-transparent">
          <button
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product.id);
              toast.success(`${product.name} added to cart`);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold tracking-wide uppercase bg-gold text-[#0F0F10] rounded-full py-2.5 hover:bg-[#e4c25c] transition-colors"
          >
            <ShoppingBag size={13} /> Add
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView?.(product);
            }}
            className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full bg-white/10 backdrop-blur hover:bg-white/20 transition-colors"
            aria-label="Quick view"
          >
            <Eye size={14} className="text-white" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <p className="text-[10px] tracking-luxe uppercase text-gold/80 mb-1">{product.line}</p>
        <h3 className="font-display text-[15px] text-white leading-snug mb-1.5 truncate">{product.name}</h3>
        <div className="flex items-center gap-1.5 mb-2">
          <RatingStars rating={product.rating} size={12} />
          <span className="text-[11px] text-white/40">({product.reviews})</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-white font-semibold text-[15px]">{formatINR(displayPrice)}</span>
          {displayPrice < product.price ? (
            <span className="text-white/35 text-xs line-through">{formatINR(product.price)}</span>
          ) : product.originalPrice ? (
            <span className="text-white/35 text-xs line-through">{formatINR(product.originalPrice)}</span>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
