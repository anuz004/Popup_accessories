import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { fallbackProducts, type Product, type Offer } from "@/data/products";

interface ProductRow {
  id: string;
  name: string;
  line: string;
  category: string;
  gender: string;
  price: number;
  original_price: number | null;
  rating: number;
  reviews: number;
  badge: string | null;
  style: string;
  case_color: string;
  dial_color: string;
  accent: string;
  movement: string;
  water_resistance: string;
  dial: string;
  case_material: string;
  strap_material: string;
  case_size: string;
  description: string;
  short: string;
  image_url: string | null;
  active: boolean;
}

interface OfferRow {
  id: string;
  title: string;
  code: string | null;
  discount_type: string;
  discount_value: number;
  scope: string;
  target: string | null;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}

function rowToProduct(r: ProductRow): Product {
  return {
    id: r.id,
    name: r.name,
    line: r.line,
    category: r.category as Product["category"],
    gender: r.gender as Product["gender"],
    price: r.price,
    originalPrice: r.original_price,
    rating: Number(r.rating),
    reviews: r.reviews,
    badge: r.badge as Product["badge"],
    style: r.style as Product["style"],
    caseColor: r.case_color,
    dialColor: r.dial_color,
    accent: r.accent,
    movement: r.movement as Product["movement"],
    waterResistance: r.water_resistance,
    dial: r.dial,
    caseMaterial: r.case_material,
    strapMaterial: r.strap_material,
    caseSize: r.case_size,
    description: r.description,
    short: r.short,
    imageUrl: r.image_url,
    active: r.active,
  };
}

function rowToOffer(r: OfferRow): Offer {
  return {
    id: r.id,
    title: r.title,
    code: r.code,
    discountType: r.discount_type as Offer["discountType"],
    discountValue: Number(r.discount_value),
    scope: r.scope as Offer["scope"],
    target: r.target,
    active: r.active,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
  };
}

interface ProductsState {
  products: Product[];
  offers: Offer[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  bestPriceFor: (product: Product) => { price: number; offer: Offer | null };
}

const ProductsContext = createContext<ProductsState | null>(null);

function offerIsLive(o: Offer) {
  const now = Date.now();
  if (o.startsAt && new Date(o.startsAt).getTime() > now) return false;
  if (o.endsAt && new Date(o.endsAt).getTime() < now) return false;
  return o.active;
}

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [{ data: prodData, error: prodErr }, { data: offerData, error: offerErr }] = await Promise.all([
      supabase.from("products").select("*").eq("active", true).order("created_at", { ascending: false }),
      supabase.from("offers").select("*"),
    ]);
    if (prodErr) {
      setError(`Live catalogue unavailable: ${prodErr.message}`);
      setProducts(fallbackProducts);
    } else {
      setProducts(((prodData as ProductRow[]) ?? []).map(rowToProduct));
    }
    setOffers(((offerData as OfferRow[]) ?? []).map(rowToOffer));
    setLoading(false);
    if (offerErr) console.warn("offers fetch failed", offerErr.message);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const bestPriceFor = useCallback(
    (product: Product) => {
      const live = offers.filter(offerIsLive).filter((o) => !o.code); // only automatic (no-code) offers apply directly
      const applicable = live.filter(
        (o) => o.scope === "all" || (o.scope === "category" && o.target === product.category) || (o.scope === "product" && o.target === product.id)
      );
      let best = { price: product.price, offer: null as Offer | null };
      for (const o of applicable) {
        const price =
          o.discountType === "percent"
            ? Math.round(product.price * (1 - o.discountValue / 100))
            : Math.max(0, product.price - o.discountValue);
        if (price < best.price) best = { price, offer: o };
      }
      return best;
    },
    [offers]
  );

  return (
    <ProductsContext.Provider value={{ products, offers, loading, error, refresh, bestPriceFor }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used within ProductsProvider");
  return ctx;
}
