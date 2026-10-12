import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { QuickViewDialog } from "@/components/QuickViewDialog";
import { DialEyebrow } from "@/components/DialEyebrow";
import { type Product } from "@/data/products";
import { useProducts } from "@/context/ProductsContext";
import { useRouter } from "@/context/RouterContext";
import { formatINR } from "@/context/StoreContext";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const CATEGORIES = ["Classic", "Sport", "Luxury", "Smart", "Limited Edition"];
const GENDERS = ["Men", "Women", "Unisex"];
const MOVEMENTS = ["Automatic", "Quartz", "Smart OS"];

type Sort = "newest" | "popular" | "low" | "high";

export function Shop() {
  const { shopFilter, go } = useRouter();
  const { products, bestPriceFor, loading } = useProducts();
  const [categories, setCategories] = useState<string[]>([]);
  const [genders, setGenders] = useState<string[]>([]);
  const [movements, setMovements] = useState<string[]>([]);
  const [lines, setLines] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(15000);
  const [sort, setSort] = useState<Sort>("newest");
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [sortOpen, setSortOpen] = useState(false);
  const LINES = useMemo(() => Array.from(new Set(products.map((p) => p.line))), [products]);

  useEffect(() => {
    if (shopFilter?.category) {
      setCategories([shopFilter.category]);
    } else {
      setCategories([]);
    }
  }, [shopFilter]);

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (categories.length && !categories.includes(p.category)) return false;
      if (genders.length && !genders.includes(p.gender)) return false;
      if (movements.length && !movements.includes(p.movement)) return false;
      if (lines.length && !lines.includes(p.line)) return false;
      if (bestPriceFor(p).price > maxPrice) return false;
      return true;
    });
    switch (sort) {
      case "low":
        list = [...list].sort((a, b) => bestPriceFor(a).price - bestPriceFor(b).price);
        break;
      case "high":
        list = [...list].sort((a, b) => bestPriceFor(b).price - bestPriceFor(a).price);
        break;
      case "popular":
        list = [...list].sort((a, b) => b.reviews - a.reviews);
        break;
      default:
        list = [...list].sort((a, b) => (b.badge === "New" ? 1 : 0) - (a.badge === "New" ? 1 : 0));
    }
    return list;
  }, [products, categories, genders, movements, lines, maxPrice, sort, bestPriceFor]);

  const clearAll = () => {
    setCategories([]);
    setGenders([]);
    setMovements([]);
    setLines([]);
    setMaxPrice(15000);
    go("shop");
  };

  const activeCount = categories.length + genders.length + movements.length + lines.length + (maxPrice < 15000 ? 1 : 0);

  const FilterPanel = (
    <div className="space-y-8">
      <FilterGroup title="Category">
        {CATEGORIES.map((c) => (
          <Checkbox key={c} label={c} checked={categories.includes(c)} onChange={() => toggle(categories, setCategories, c)} />
        ))}
      </FilterGroup>
      <FilterGroup title="Collection / Brand">
        {LINES.map((l) => (
          <Checkbox key={l} label={l} checked={lines.includes(l)} onChange={() => toggle(lines, setLines, l)} />
        ))}
      </FilterGroup>
      <FilterGroup title="Gender">
        {GENDERS.map((g) => (
          <Checkbox key={g} label={g} checked={genders.includes(g)} onChange={() => toggle(genders, setGenders, g)} />
        ))}
      </FilterGroup>
      <FilterGroup title="Movement">
        {MOVEMENTS.map((m) => (
          <Checkbox key={m} label={m} checked={movements.includes(m)} onChange={() => toggle(movements, setMovements, m)} />
        ))}
      </FilterGroup>
      <FilterGroup title="Max Price">
        <input
          type="range"
          min={3000}
          max={15000}
          step={500}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-[#D4AF37]"
        />
        <p className="text-xs text-white/50 mt-2">Up to {formatINR(maxPrice)}</p>
      </FilterGroup>
      {activeCount > 0 && (
        <button onClick={clearAll} className="text-xs text-gold underline underline-offset-4">
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 pt-28 md:pt-32 pb-24">
      <DialEyebrow hour="II" label="Shop All" />
      <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
        <div>
          <h1 className="font-display text-4xl md:text-5xl text-white mb-2">
            {categories.length === 1 ? categories[0] : "The Full Collection"}
          </h1>
          <p className="text-white/45 text-sm">{filtered.length} timepieces</p>
        </div>

        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <button className="lg:hidden flex items-center gap-2 border border-white/15 rounded-full px-4 py-2.5 text-xs uppercase tracking-wide text-white">
                <SlidersHorizontal size={14} /> Filters {activeCount > 0 && `(${activeCount})`}
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-[#0b0b0c] border-white/10 w-[300px] overflow-y-auto">
              <p className="font-display text-lg text-white mb-6 mt-4">Filters</p>
              {FilterPanel}
            </SheetContent>
          </Sheet>

          <div className="relative">
            <button
              onClick={() => setSortOpen((v) => !v)}
              className="flex items-center gap-2 border border-white/15 rounded-full px-4 py-2.5 text-xs uppercase tracking-wide text-white hover:border-gold/50 transition-colors"
            >
              Sort: {{ newest: "Newest", popular: "Popular", low: "Price: Low to High", high: "Price: High to Low" }[sort]}
              <ChevronDown size={13} />
            </button>
            <AnimatePresence>
              {sortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute right-0 mt-2 w-48 bg-[#111114] border border-white/10 rounded-xl overflow-hidden z-20 shadow-2xl"
                >
                  {(["newest", "popular", "low", "high"] as Sort[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSort(s);
                        setSortOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs hover:bg-white/5 ${sort === s ? "text-gold" : "text-white/70"}`}
                    >
                      {{ newest: "Newest", popular: "Popular", low: "Price: Low to High", high: "Price: High to Low" }[s]}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-10">
        <aside className="hidden lg:block">
          <div className="sticky top-28">{FilterPanel}</div>
        </aside>

        <div>
          {activeCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {[...categories, ...genders, ...movements, ...lines].map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white/70">
                  {tag}
                  <button
                    onClick={() => {
                      setCategories((c) => c.filter((v) => v !== tag));
                      setGenders((g) => g.filter((v) => v !== tag));
                      setMovements((m) => m.filter((v) => v !== tag));
                      setLines((l) => l.filter((v) => v !== tag));
                    }}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-[20px] bg-[#111114] border border-white/[0.06] animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-white/50 mb-4">No pieces match these filters.</p>
              <button onClick={clearAll} className="text-gold text-sm underline underline-offset-4">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
              {filtered.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} onQuickView={setQuickView} />
              ))}
            </div>
          )}
        </div>
      </div>

      <QuickViewDialog product={quickView} onOpenChange={(open) => !open && setQuickView(null)} />
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-white text-xs uppercase tracking-wide mb-3">{title}</p>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <span
        className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
          checked ? "bg-gold border-gold" : "border-white/25 group-hover:border-white/50"
        }`}
      >
        {checked && <span className="h-1.5 w-1.5 rounded-sm bg-[#0F0F10]" />}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="hidden" />
      <span className="text-sm text-white/65 group-hover:text-white transition-colors">{label}</span>
    </label>
  );
}
