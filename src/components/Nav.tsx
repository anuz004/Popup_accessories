import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { Search, Heart, ShoppingBag, Menu, X, Watch } from "lucide-react";
import { useRouter } from "@/context/RouterContext";
import { useStore, formatINR } from "@/context/StoreContext";
import { useProducts } from "@/context/ProductsContext";
import { ProductVisual } from "@/components/ProductVisual";

const NAV_LINKS: { label: string; page: "home" | "shop" | "about" | "contact"; category?: string }[] = [
  { label: "Home", page: "home" },
  { label: "Shop All", page: "shop" },
  { label: "Luxury", page: "shop", category: "Luxury" },
  { label: "Sport", page: "shop", category: "Sport" },
  { label: "About", page: "about" },
  { label: "Contact", page: "contact" },
];

export function Nav() {
  const { go, page } = useRouter();
  const { cartCount, wishlist } = useStore();
  const { products } = useProducts();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 40);
  });

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const results =
    query.trim().length > 0
      ? products
          .filter(
            (p) =>
              p.name.toLowerCase().includes(query.toLowerCase()) ||
              p.line.toLowerCase().includes(query.toLowerCase()) ||
              p.category.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, 5)
      : [];

  return (
    <>
      <motion.header
        animate={{
          backgroundColor: scrolled ? "rgba(8,8,8,0.88)" : "rgba(8,8,8,0)",
          borderColor: scrolled ? "rgba(212,175,55,0.15)" : "rgba(212,175,55,0)",
        }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 inset-x-0 z-50 backdrop-blur-md border-b"
      >
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className={`flex items-center justify-between transition-all duration-300 ${scrolled ? "h-16" : "h-20"}`}>
            <button
              onClick={() => go("home")}
              className="flex items-center gap-2 font-display text-white shrink-0"
            >
              <Watch size={22} className="text-gold" strokeWidth={1.5} />
              <span className="text-lg md:text-xl tracking-[0.1em] md:tracking-[0.15em]">
                <span className="sm:hidden">POPUP</span>
                <span className="hidden sm:inline">POPUP ACCESSORIES</span>
              </span>
            </button>

            <nav className="hidden lg:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.label}
                  onClick={() => go(link.page, link.category ? { category: link.category } : undefined)}
                  className={`text-[13px] tracking-wide uppercase transition-colors relative py-2 ${
                    page === link.page ? "text-gold" : "text-white/75 hover:text-white"
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-1.5 md:gap-3">
              <div className="relative" ref={searchRef}>
                <button
                  onClick={() => setSearchOpen((v) => !v)}
                  className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-white/5 text-white/85 transition-colors"
                  aria-label="Search"
                >
                  <Search size={18} />
                </button>
                <AnimatePresence>
                  {searchOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, width: 0 }}
                      animate={{ opacity: 1, y: 0, width: 320 }}
                      exit={{ opacity: 0, y: -8, width: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 mt-3 bg-[#111114] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                    >
                      <div className="p-3 border-b border-white/10">
                        <input
                          autoFocus
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search brand, name, category…"
                          className="w-full bg-transparent text-sm text-white placeholder:text-white/35 outline-none"
                        />
                      </div>
                      {results.length > 0 && (
                        <div className="max-h-80 overflow-y-auto">
                          {results.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => {
                                go("product", { productId: p.id });
                                setSearchOpen(false);
                                setQuery("");
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 text-left"
                            >
                              <div className="h-10 w-10 rounded-lg bg-[#17181C] shrink-0 p-1">
                                <ProductVisual product={p} className="w-full h-full" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] text-white truncate">{p.name}</p>
                                <p className="text-[11px] text-white/40">{formatINR(p.price)}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {query.trim().length > 0 && results.length === 0 && (
                        <p className="px-3 py-4 text-xs text-white/40">No pieces match "{query}".</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => go("shop")}
                className="hidden md:flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/5 text-white/85 relative transition-colors"
                aria-label="Wishlist"
              >
                <Heart size={18} className={wishlist.length ? "fill-gold text-gold" : ""} />
                {wishlist.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-gold text-[9px] font-bold text-[#0F0F10] flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => go("cart")}
                className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-white/5 text-white/85 relative transition-colors"
                aria-label="Cart"
              >
                <ShoppingBag size={18} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-gold text-[9px] font-bold text-[#0F0F10] flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden h-9 w-9 flex items-center justify-center rounded-full hover:bg-white/5 text-white/85"
                aria-label="Menu"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-[#080808]/98 backdrop-blur lg:hidden"
          >
            <div className="flex justify-between items-center px-5 h-20">
              <span className="font-display text-lg text-white tracking-[0.15em]">POPUP ACCESSORIES</span>
              <button onClick={() => setMobileOpen(false)} className="h-9 w-9 flex items-center justify-center text-white">
                <X size={22} />
              </button>
            </div>
            <nav className="flex flex-col px-5 gap-1 mt-6">
              {NAV_LINKS.map((link, i) => (
                <motion.button
                  key={link.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => {
                    go(link.page, link.category ? { category: link.category } : undefined);
                    setMobileOpen(false);
                  }}
                  className="text-left text-2xl font-display text-white/90 py-3 border-b border-white/10"
                >
                  {link.label}
                </motion.button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
