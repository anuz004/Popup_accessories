import { useRef, useState } from "react";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { ArrowRight, ShieldCheck, Gem, Truck, RotateCcw, Banknote, Award, Camera } from "lucide-react";
import { WatchArt } from "@/components/WatchArt";
import { ProductVisual } from "@/components/ProductVisual";
import { ProductCard } from "@/components/ProductCard";
import { QuickViewDialog } from "@/components/QuickViewDialog";
import { DialEyebrow } from "@/components/DialEyebrow";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { RatingStars } from "@/components/RatingStars";
import { collections, testimonials } from "@/data/products";
import type { Product } from "@/data/products";
import { useProducts } from "@/context/ProductsContext";
import { useRouter } from "@/context/RouterContext";
import { subscribeNewsletter } from "@/lib/customerMessages";
import { toast } from "sonner";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export function Home() {
  const { go } = useRouter();
  const { products } = useProducts();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const watchScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const [quickView, setQuickView] = useState<Product | null>(null);

  const trending = products.filter((p) => p.badge === "Bestseller" || p.badge === "New" || p.rating >= 4.8).slice(0, 8);

  return (
    <div>
      {/* ================= HERO ================= */}
      <section ref={heroRef} className="relative min-h-[100svh] flex items-center overflow-hidden bg-[#080808]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(212,175,55,0.10),transparent_60%)]" />
        <motion.div
          style={{ y: heroY }}
          className="absolute -right-32 top-1/2 -translate-y-1/2 w-[560px] h-[560px] md:w-[720px] md:h-[720px] opacity-90"
        >
          <motion.div style={{ scale: watchScale }} className="w-full h-full">
            <WatchArt style="classic" caseColor="#C9A961" dialColor="#0F0F10" accent="#D4AF37" className="w-full h-full" />
          </motion.div>
        </motion.div>

        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 w-full pt-24">
          <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.12 } } }} className="max-w-xl">
            <motion.span variants={fadeUp} className="inline-flex items-center gap-2 text-gold text-xs tracking-luxe uppercase mb-6 border border-gold/30 rounded-full px-4 py-1.5">
              Coimbatore's Watch &amp; Accessories Store
            </motion.span>
            <motion.h1 variants={fadeUp} className="font-display text-5xl sm:text-6xl md:text-7xl leading-[1.05] text-white mb-6">
              Timeless Style.<br />
              <span className="text-gold italic">Everyday</span> Confidence.
            </motion.h1>
            <motion.p variants={fadeUp} className="text-white/55 text-base md:text-lg leading-relaxed mb-10 max-w-md">
              Popup Accessories brings you a carefully chosen collection of watches for every lifestyle — genuine products, honest prices, and Cash on Delivery across India.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => go("shop")}
                className="group inline-flex items-center gap-2 bg-gold text-[#0F0F10] rounded-full px-7 py-3.5 text-sm font-semibold uppercase tracking-wide hover:bg-[#e4c25c] transition-colors"
              >
                Shop Collection
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => go("shop", { category: "Limited Edition" })}
                className="inline-flex items-center gap-2 border border-white/25 text-white rounded-full px-7 py-3.5 text-sm font-medium uppercase tracking-wide hover:border-gold/60 hover:text-gold transition-colors"
              >
                Explore Watches
              </button>
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40"
        >
          <span className="text-[10px] tracking-luxe uppercase">Scroll</span>
          <motion.span animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.6 }} className="h-8 w-px bg-white/30" />
        </motion.div>
      </section>

      {/* ================= FEATURED COLLECTIONS ================= */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-24 md:py-32">
        <DialEyebrow hour="XII" label="The Collections" />
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <h2 className="font-display text-3xl md:text-4xl text-white max-w-lg">Five houses, one standard of craft.</h2>
          <button onClick={() => go("shop")} className="text-gold text-sm flex items-center gap-1 hover:gap-2 transition-all">
            View all watches <ArrowRight size={15} />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {collections.map((c, i) => (
            <motion.button
              key={c.key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              whileHover={{ y: -6 }}
              onClick={() => go("shop", { category: c.key })}
              className={`relative text-left rounded-[20px] p-7 overflow-hidden border border-white/[0.06] bg-gradient-to-br from-[#141417] to-[#0c0c0d] ${
                i === 0 ? "sm:col-span-2 lg:col-span-1 lg:row-span-2" : ""
              }`}
            >
              <div className="relative z-10">
                <p className="text-gold text-xs tracking-luxe uppercase mb-3">{String(products.filter((p) => p.category === c.key).length).padStart(2, "0")} Pieces</p>
                <h3 className="font-display text-2xl text-white mb-2">{c.title}</h3>
                <p className="text-white/50 text-sm mb-6 max-w-[220px]">{c.copy}</p>
                <span className="inline-flex items-center gap-1 text-sm text-white/80">
                  Discover <ArrowRight size={14} />
                </span>
              </div>
              <div className={`absolute ${i === 0 ? "-right-10 -bottom-6 w-56 h-56" : "-right-8 -bottom-8 w-40 h-40"} opacity-90`}>
                <WatchArt style={c.style} caseColor={c.caseColor} dialColor={c.dialColor} animated={false} className="w-full h-full" />
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* ================= TRENDING ================= */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-12 md:py-20">
        <DialEyebrow hour="III" label="Trending Now" />
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <h2 className="font-display text-3xl md:text-4xl text-white">Most wanted this season.</h2>
          <button onClick={() => go("shop")} className="text-gold text-sm flex items-center gap-1 hover:gap-2 transition-all">
            View all <ArrowRight size={15} />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {trending.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} onQuickView={setQuickView} />
          ))}
        </div>
      </section>

      {/* ================= WHY CHOOSE US ================= */}
      <section className="bg-[#0b0b0c] border-y border-white/[0.06] py-24 md:py-28 my-8">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <DialEyebrow hour="VI" label="Why Popup Accessories" />
          <h2 className="font-display text-3xl md:text-4xl text-white mb-14 max-w-lg">
            A trusted local store, now online.
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.06] rounded-[20px] overflow-hidden">
            {[
              { icon: ShieldCheck, title: "Quality Assured", copy: "Every watch is checked before it ships — trendy, stylish, and built to last." },
              { icon: Gem, title: "Premium Collection", copy: "Curated styles for men and women, for everyday wear or a special occasion." },
              { icon: Banknote, title: "Cash on Delivery", copy: "Shop with confidence and pay only when your order arrives at your door." },
              { icon: RotateCcw, title: "Affordable Prices", copy: "Excellent value on every piece, without compromising on quality." },
              { icon: Truck, title: "Fast Order Processing", copy: "Quick, reliable dispatch so your order reaches you without the wait." },
              { icon: Award, title: "Friendly Support", copy: "A trusted Coimbatore store — real people, ready to help you choose." },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="bg-[#0b0b0c] p-8 hover:bg-[#111114] transition-colors"
              >
                <f.icon className="text-gold mb-4" size={26} strokeWidth={1.5} />
                <h3 className="text-white font-medium mb-2">{f.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{f.copy}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 text-center">
            {[
              { to: 5000, suffix: "+", label: "Happy Customers" },
              { to: 4, suffix: ".8/5", label: "Average Rating" },
              { to: 50, suffix: "+", label: "Styles In Store" },
              { to: 100, suffix: "%", label: "Genuine Products" },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-display text-3xl md:text-4xl text-gold mb-1">
                  <AnimatedCounter to={s.to} suffix={s.suffix} />
                </p>
                <p className="text-white/40 text-xs uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= BANNER ================= */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="relative rounded-[20px] overflow-hidden bg-gradient-to-r from-[#17181C] via-[#141417] to-[#0F0F10] border border-gold/15 px-8 md:px-16 py-16 md:py-20 flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div className="absolute -left-16 -top-16 w-64 h-64 opacity-[0.07]">
            <WatchArt style="diamond" caseColor="#D4AF37" dialColor="#080808" animated={false} className="w-full h-full" />
          </div>
          <div className="relative z-10 max-w-lg text-center md:text-left">
            <p className="text-gold text-xs tracking-luxe uppercase mb-3">New Arrivals</p>
            <h2 className="font-display text-3xl md:text-4xl text-white mb-4">The Obsidian line has just landed.</h2>
            <p className="text-white/50 text-sm">Bold, statement pieces in a small first batch — while stocks last.</p>
          </div>
          <button
            onClick={() => go("shop", { category: "Limited Edition" })}
            className="relative z-10 shrink-0 inline-flex items-center gap-2 bg-gold text-[#0F0F10] rounded-full px-7 py-3.5 text-sm font-semibold uppercase tracking-wide hover:bg-[#e4c25c] transition-colors"
          >
            Shop Limited Edition <ArrowRight size={16} />
          </button>
        </motion.div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-24 md:py-32">
        <DialEyebrow hour="IX" label="Client Voices" />
        <h2 className="font-display text-3xl md:text-4xl text-white mb-12 max-w-lg">Worn by collectors, trusted by first-timers.</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.08 }}
              className="rounded-[20px] bg-[#111114] border border-white/[0.06] p-6 flex flex-col"
            >
              <RatingStars rating={t.rating} />
              <p className="text-white/70 text-sm leading-relaxed my-5 flex-1">"{t.quote}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gold/40 to-gold/10 flex items-center justify-center text-gold text-xs font-semibold">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-white text-sm">{t.name}</p>
                  <p className="text-white/35 text-xs">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= INSTAGRAM GALLERY ================= */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-12 md:py-20">
        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div>
            <DialEyebrow hour="I" label="From The Atelier" />
            <h2 className="font-display text-3xl md:text-4xl text-white">@popupaccessories</h2>
          </div>
          <span className="text-gold text-sm flex items-center gap-1.5"><Camera size={15} /> The collection</span>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {products.slice(0, 12).map((p, i) => (
            <motion.div
              key={p.id + "-ig"}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: (i % 6) * 0.05 }}
              className="group relative aspect-square rounded-xl overflow-hidden bg-gradient-to-b from-[#17181C] to-[#0b0b0c] cursor-pointer"
              onClick={() => go("product", { productId: p.id })}
            >
              <motion.div whileHover={{ scale: 1.12 }} transition={{ duration: 0.5 }} className="w-full h-full p-4">
                <ProductVisual product={p} className="w-full h-full" />
              </motion.div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <Camera size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= NEWSLETTER ================= */}
      <NewsletterBand />

      <QuickViewDialog product={quickView} onOpenChange={(open) => !open && setQuickView(null)} />
    </div>
  );
}

function NewsletterBand() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  return (
    <section className="max-w-7xl mx-auto px-5 md:px-8 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="rounded-[20px] border border-white/[0.06] bg-[#111114] px-8 md:px-16 py-14 text-center"
      >
        <h2 className="font-display text-2xl md:text-3xl text-white mb-3">Join the inner circle.</h2>
        <p className="text-white/50 text-sm mb-7 max-w-md mx-auto">Early access to limited releases and one atelier story a month. No spam, ever.</p>
        {sent ? (
          <p className="text-gold text-sm">You're on the list — welcome to Popup Accessories.</p>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setSubmitting(true);
              const { error } = await subscribeNewsletter(email);
              setSubmitting(false);
              if (error) return toast.error(`Could not subscribe: ${error}`);
              setSent(true);
            }}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              placeholder="Your email address"
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-gold/50"
            />
            <button disabled={submitting} className="bg-gold text-[#0F0F10] rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-wide hover:bg-[#e4c25c] transition-colors disabled:opacity-60">
              {submitting ? "Subscribing…" : "Subscribe"}
            </button>
          </form>
        )}
      </motion.div>
    </section>
  );
}
