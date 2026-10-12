import { motion, type Variants } from "framer-motion";
import { MapPin, ShieldCheck, Banknote, Smile, Truck, Star, ArrowRight } from "lucide-react";
import { WatchArt } from "@/components/WatchArt";
import { DialEyebrow } from "@/components/DialEyebrow";
import { useRouter } from "@/context/RouterContext";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const REASONS = [
  { icon: ShieldCheck, text: "Premium collection of watches for men and women" },
  { icon: Star, text: "Trendy, stylish, and quality-assured products" },
  { icon: Banknote, text: "Affordable prices with excellent value" },
  { icon: Truck, text: "Cash on Delivery available" },
  { icon: Smile, text: "Friendly customer support" },
  { icon: MapPin, text: "A trusted local store serving Coimbatore and beyond" },
];

export function About() {
  const { go } = useRouter();

  return (
    <div>
      <section className="max-w-7xl mx-auto px-5 md:px-8 pt-28 md:pt-36 pb-16 grid md:grid-cols-2 gap-12 items-center">
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1 } } }}>
          <motion.div variants={fadeUp}>
            <DialEyebrow hour="XI" label="Our Story" />
          </motion.div>
          <motion.h1 variants={fadeUp} className="font-display text-4xl md:text-5xl text-white mb-6 leading-tight">
            About Popup Accessories
          </motion.h1>
          <motion.p variants={fadeUp} className="text-white/60 text-base leading-relaxed mb-5">
            Welcome to Popup Accessories, your trusted destination for premium watches and fashion accessories in
            the heart of Coimbatore. Conveniently located at H.R Complex, Prakasam Bus Stop, Oppanakara Street,
            near AB Lodge, Town Hall, Coimbatore, we are dedicated to bringing you an exceptional collection of
            stylish, high-quality timepieces that suit every lifestyle and occasion.
          </motion.p>
          <motion.p variants={fadeUp} className="text-white/60 text-base leading-relaxed mb-5">
            Whether you're looking for a timeless classic, a modern everyday watch, a sporty design, or a luxury
            statement piece, Popup Accessories offers carefully selected collections that combine elegance,
            durability, and value. We believe that a watch is more than just a way to tell time — it's an
            expression of your personality and style.
          </motion.p>
          <motion.p variants={fadeUp} className="text-white/60 text-base leading-relaxed">
            Our mission is to provide customers with a seamless shopping experience through a user-friendly online
            store, genuine products, competitive pricing, and reliable customer service.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative aspect-square max-w-sm mx-auto"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.12),transparent_65%)]" />
          <WatchArt style="classic" caseColor="#C9A961" dialColor="#0F0F10" accent="#D4AF37" className="w-full h-full" />
        </motion.div>
      </section>

      <section className="bg-[#0b0b0c] border-y border-white/[0.06] py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <DialEyebrow hour="II" label="Why Choose Us" />
          <h2 className="font-display text-3xl md:text-4xl text-white mb-12 max-w-xl">
            Genuine products, honest prices, and service that treats you right.
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {REASONS.map((r, i) => (
              <motion.div
                key={r.text}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="flex items-start gap-4 rounded-[20px] bg-[#111114] border border-white/[0.06] p-6"
              >
                <r.icon size={20} className="text-gold shrink-0 mt-0.5" strokeWidth={1.5} />
                <p className="text-white/75 text-sm leading-relaxed">{r.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 md:px-8 py-20 md:py-24 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <h2 className="font-display text-2xl md:text-3xl text-white mb-3">Timeless Style. Everyday Confidence.</h2>
          <p className="text-white/50 text-sm mb-8 max-w-lg mx-auto">
            Whether you're shopping for yourself or searching for the perfect gift, we're here to make every
            purchase a memorable experience.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => go("shop")}
              className="inline-flex items-center gap-2 bg-gold text-[#0F0F10] rounded-full px-7 py-3.5 text-sm font-semibold uppercase tracking-wide hover:bg-[#e4c25c] transition-colors"
            >
              Shop Collection <ArrowRight size={16} />
            </button>
            <button
              onClick={() => go("contact")}
              className="inline-flex items-center gap-2 border border-white/25 text-white rounded-full px-7 py-3.5 text-sm font-medium uppercase tracking-wide hover:border-gold/60 hover:text-gold transition-colors"
            >
              Visit Our Store
            </button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
