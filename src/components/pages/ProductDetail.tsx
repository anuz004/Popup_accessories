import { useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Heart, ShoppingBag, Minus, Plus, RotateCw, CheckCircle2, ChevronRight, Zap } from "lucide-react";
import { ProductVisual } from "@/components/ProductVisual";
import { RatingStars } from "@/components/RatingStars";
import { ProductCard } from "@/components/ProductCard";
import { DialEyebrow } from "@/components/DialEyebrow";
import { useProducts } from "@/context/ProductsContext";
import { useStore, formatINR } from "@/context/StoreContext";
import { useRouter } from "@/context/RouterContext";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";

const VIEWS = [
  { label: "Front", rotate: 0, scale: 1 },
  { label: "Angled", rotate: 18, scale: 1.05 },
  { label: "Detail", rotate: -8, scale: 1.35 },
] as const;

export function ProductDetail() {
  const { productId, go } = useRouter();
  const { addToCart, toggleWishlist, isWishlisted } = useStore();
  const { products, bestPriceFor, loading } = useProducts();
  const [qty, setQty] = useState(1);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [slide, setSlide] = useState(0);
  const ctaRef = useRef<HTMLDivElement>(null);
  const ctaInView = useInView(ctaRef, { margin: "-80px 0px -80% 0px" });

  const product = products.find((p) => p.id === productId);

  if (!product) {
    if (loading) {
      return (
        <div className="max-w-7xl mx-auto px-5 md:px-8 pt-40 pb-24 text-center text-white/40">
          Loading…
        </div>
      );
    }
    return (
      <div className="max-w-7xl mx-auto px-5 md:px-8 pt-40 pb-24 text-center">
        <p className="text-white/60 mb-6">This piece could not be found.</p>
        <button onClick={() => go("shop")} className="text-gold underline underline-offset-4">
          Back to shop
        </button>
      </div>
    );
  }

  const photos = product.imageUrls?.length ? product.imageUrls : product.imageUrl ? [product.imageUrl] : [];
  const views = photos.length ? photos.map((url, i) => ({ label: `Photo ${i + 1}`, rotate: 0, scale: 1, url })) : VIEWS.map(v => ({ ...v, url: undefined }));
  const selected = Math.min(slide, views.length - 1);

  const related = products.filter((p) => p.id !== product.id && (p.line === product.line || p.category === product.category)).slice(0, 4);
  const wished = isWishlisted(product.id);
  const { price: effectivePrice, offer: activeOffer } = bestPriceFor(product);

  const spin360 = () => {
    setSpinning(true);
    setRotation((r) => r + 360);
    setTimeout(() => setSpinning(false), 900);
  };

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 pt-28 md:pt-32 pb-24">
      <div className="flex items-center gap-1.5 text-xs text-white/40 mb-8 flex-wrap">
        <button onClick={() => go("home")} className="hover:text-gold">Home</button>
        <ChevronRight size={12} />
        <button onClick={() => go("shop", { category: product.category })} className="hover:text-gold">{product.category}</button>
        <ChevronRight size={12} />
        <span className="text-white/60">{product.name}</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-14">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square rounded-[20px] bg-gradient-to-b from-[#17181C] to-[#0b0b0c] border border-white/[0.06] overflow-hidden mb-4 group touch-pan-y">
            <motion.div
              className="w-full h-full p-14 cursor-grab active:cursor-grabbing"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) setSlide((s) => (s + 1) % views.length);
                else if (info.offset.x > 60) setSlide((s) => (s - 1 + views.length) % views.length);
              }}
              whileHover={{ scale: views[selected].scale * 1.06 }}
              animate={{ rotate: rotation + views[selected].rotate, scale: views[selected].scale }}
              transition={{ rotate: { duration: spinning ? 0.9 : 0.5, ease: "easeInOut" }, scale: { duration: 0.4 } }}
            >
              <ProductVisual product={product} imageUrl={views[selected].url} animated className="w-full h-full drop-shadow-2xl" />
            </motion.div>
            {product.badge && (
              <span className="absolute top-4 left-4 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full bg-gold text-[#0F0F10]">
                {product.badge}
              </span>
            )}
            <div className="absolute bottom-4 inset-x-4 flex items-center justify-between">
              <div className="flex gap-1.5">
                {views.map((v, i) => (
                  <button
                    key={v.label}
                    onClick={() => setSlide(i)}
                    aria-label={`Show ${v.label} view`}
                    className={`h-1.5 rounded-full transition-all ${i === selected ? "w-6 bg-gold" : "w-1.5 bg-white/30"}`}
                  />
                ))}
              </div>
              <button
                onClick={spin360}
                disabled={spinning}
                className="flex items-center gap-1.5 bg-black/50 backdrop-blur text-white text-[11px] uppercase tracking-wide px-3 py-2 rounded-full hover:bg-black/70 transition-colors"
              >
                <RotateCw size={13} className={spinning ? "animate-spin" : ""} /> 360°
              </button>
            </div>
          </div>
          <div className={`grid gap-3 ${photos.length ? "grid-cols-5" : "grid-cols-3"}`}>
            {views.map((v, i) => (
              <button
                key={v.label}
                aria-label={`Select ${v.label}`}
                onClick={() => setSlide(i)}
                className={`aspect-square rounded-xl bg-[#111114] border p-4 flex flex-col items-center justify-center gap-1.5 transition-colors ${
                  i === selected ? "border-gold/60" : "border-white/[0.06] hover:border-white/20"
                }`}
              >
                <ProductVisual product={product} imageUrl={v.url} className="w-full h-full opacity-90" />
                <span className={`text-[10px] uppercase tracking-wide ${i === selected ? "text-gold" : "text-white/40"}`}>{v.label}</span>
              </button>
            ))}
          </div>
          <p className="lg:hidden text-center text-white/25 text-[11px] mt-3">Swipe to see more photos</p>
        </div>

        {/* Info */}
        <div>
          <p className="text-gold text-xs tracking-luxe uppercase mb-3">{product.line} &middot; {product.category}</p>
          <h1 className="font-display text-3xl md:text-4xl text-white mb-3">{product.name}</h1>
          <div className="flex items-center gap-3 mb-6">
            <RatingStars rating={product.rating} />
            <span className="text-xs text-white/40">{product.rating} &middot; {product.reviews} reviews</span>
          </div>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-white font-semibold text-2xl">{formatINR(effectivePrice)}</span>
            {(activeOffer || product.originalPrice) && (
              <span className="text-white/35 text-base line-through">
                {formatINR(activeOffer ? product.price : product.originalPrice!)}
              </span>
            )}
            {(activeOffer || product.originalPrice) && (
              <span className="text-xs bg-red-500/15 text-red-400 px-2 py-1 rounded-full">
                Save {formatINR((activeOffer ? product.price : product.originalPrice!) - effectivePrice)}
              </span>
            )}
          </div>
          {activeOffer && (
            <p className="text-gold text-xs mb-6 -mt-4">{activeOffer.title}</p>
          )}
          <div className="flex items-center gap-2 text-sm text-emerald-400 mb-8">
            <CheckCircle2 size={16} /> In stock — ships within 24 hours
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm mb-8 pb-8 border-b border-white/[0.06]">
            <Spec label="Movement" value={product.movement} />
            <Spec label="Water Resistance" value={product.waterResistance} />
            <Spec label="Dial" value={product.dial} />
            <Spec label="Case Material" value={product.caseMaterial} />
            <Spec label="Strap" value={product.strapMaterial} />
            <Spec label="Case Size" value={product.caseSize} />
          </div>

          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm text-white/60">Quantity</span>
            <div className="flex items-center border border-white/15 rounded-full">
              <button aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-9 w-9 flex items-center justify-center text-white/70 hover:text-white">
                <Minus size={13} />
              </button>
              <span className="w-8 text-center text-white text-sm">{qty}</span>
              <button aria-label="Increase quantity" disabled={qty >= 9} onClick={() => setQty((q) => Math.min(9, q + 1))} className="h-9 w-9 flex items-center justify-center text-white/70 hover:text-white">
                <Plus size={13} />
              </button>
            </div>
          </div>

          <div ref={ctaRef} className="flex flex-col sm:flex-row gap-3 mb-4">
            <button
              onClick={() => {
                addToCart(product.id, qty);
                go("checkout");
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-[#0F0F10] rounded-full py-3.5 text-sm font-semibold uppercase tracking-wide hover:bg-white/90 transition-colors"
            >
              <Zap size={15} /> Buy Now
            </button>
            <button
              onClick={() => {
                addToCart(product.id, qty);
                toast.success(`${product.name} added to cart`);
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-gold text-[#0F0F10] rounded-full py-3.5 text-sm font-semibold uppercase tracking-wide hover:bg-[#e4c25c] transition-colors"
            >
              <ShoppingBag size={15} /> Add to Cart
            </button>
            <button
              onClick={() => toggleWishlist(product.id)}
              className="h-[50px] w-[50px] shrink-0 flex items-center justify-center rounded-full border border-white/15 hover:border-gold/50 transition-colors self-center sm:self-auto"
            >
              <Heart size={16} className={wished ? "fill-gold text-gold" : "text-white"} />
            </button>
          </div>
          <p className="text-xs text-white/35 mb-8">Cash on Delivery available across India. No online payment required.</p>

          <Accordion type="single" collapsible defaultValue="desc" className="border-t border-white/[0.06]">
            <AccordionItem value="desc" className="border-white/[0.06]">
              <AccordionTrigger className="text-white text-sm hover:text-gold">Description</AccordionTrigger>
              <AccordionContent className="text-white/55 text-sm leading-relaxed">{product.description}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="specs" className="border-white/[0.06]">
              <AccordionTrigger className="text-white text-sm hover:text-gold">Specifications</AccordionTrigger>
              <AccordionContent className="text-white/55 text-sm space-y-1.5">
                <p>Movement: {product.movement}</p>
                <p>Case Material: {product.caseMaterial}</p>
                <p>Case Size: {product.caseSize}</p>
                <p>Strap: {product.strapMaterial}</p>
                <p>Water Resistance: {product.waterResistance}</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="shipping" className="border-white/[0.06]">
              <AccordionTrigger className="text-white text-sm hover:text-gold">Shipping</AccordionTrigger>
              <AccordionContent className="text-white/55 text-sm leading-relaxed">
                Dispatched within 24 hours in tamper-proof packaging. Delivery in 3–6 business days across India via tracked courier, cash on delivery available nationwide.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="warranty" className="border-white/[0.06]">
              <AccordionTrigger className="text-white text-sm hover:text-gold">Warranty</AccordionTrigger>
              <AccordionContent className="text-white/55 text-sm leading-relaxed">
                Every Grand Hour watch comes with a 1-year manufacturer warranty covering movement defects. Reach out to our support team and we'll sort out any repairs or replacement.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-24">
          <DialEyebrow hour="V" label="You May Also Like" />
          <h2 className="font-display text-2xl md:text-3xl text-white mb-8">Complete the collection.</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {!ctaInView && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden fixed bottom-16 inset-x-0 z-40 bg-[#0b0b0c]/95 backdrop-blur-lg border-t border-white/[0.08] px-4 py-3 flex items-center gap-3"
          >
            <div className="min-w-0 shrink-0">
              <p className="text-white font-semibold text-sm leading-tight">{formatINR(effectivePrice)}</p>
              <p className="text-white/35 text-[10px] truncate max-w-[90px]">{product.name}</p>
            </div>
            <button
              onClick={() => toggleWishlist(product.id)}
              className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full border border-white/15"
            >
              <Heart size={15} className={wished ? "fill-gold text-gold" : "text-white"} />
            </button>
            <button
              onClick={() => {
                addToCart(product.id, qty);
                toast.success(`${product.name} added to cart`);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 bg-gold text-[#0F0F10] rounded-full py-2.5 text-xs font-semibold uppercase tracking-wide"
            >
              <ShoppingBag size={13} /> Add
            </button>
            <button
              onClick={() => {
                addToCart(product.id, qty);
                go("checkout");
              }}
              className="flex-1 flex items-center justify-center gap-1.5 bg-white text-[#0F0F10] rounded-full py-2.5 text-xs font-semibold uppercase tracking-wide"
            >
              <Zap size={13} /> Buy Now
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-white/35 text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className="text-white/85">{value}</p>
    </div>
  );
}
