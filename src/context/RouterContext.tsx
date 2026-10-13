import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Order } from "@/context/StoreContext";

export type Page =
  | "home"
  | "shop"
  | "wishlist"
  | "product"
  | "cart"
  | "checkout"
  | "success"
  | "about"
  | "contact"
  | "faq"
  | "warranty"
  | "returns"
  | "privacy"
  | "terms"
  | "admin"
  | "account";

interface RouterState {
  page: Page;
  productId: string | null;
  lastOrder: Order | null;
  shopFilter: { category?: string } | null;
  go: (page: Page, opts?: { productId?: string; order?: Order; category?: string }) => void;
}

const RouterContext = createContext<RouterState | null>(null);

const SIMPLE_PATHS: Partial<Record<Page, string>> = {
  home: "/", shop: "/shop", wishlist: "/wishlist", cart: "/cart", checkout: "/checkout", about: "/about",
  success: "/success", contact: "/contact", admin: "/admin", account: "/account", faq: "/faq", warranty: "/warranty",
  returns: "/returns", privacy: "/privacy", terms: "/terms",
};

function readLocation(): { page: Page; productId: string | null; category?: string } {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const [path, search = ""] = raw.split("?");
  if (path.startsWith("/product/")) {
    try { return { page: "product", productId: decodeURIComponent(path.slice(9)) }; }
    catch { return { page: "product", productId: null }; }
  }
  const entry = Object.entries(SIMPLE_PATHS).find(([, value]) => value === path);
  const category = new URLSearchParams(search).get("category") ?? undefined;
  return { page: (entry?.[0] as Page | undefined) ?? "home", productId: null, category };
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const initial = readLocation();
  const [page, setPage] = useState<Page>(initial.page);
  const [productId, setProductId] = useState<string | null>(initial.productId);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [shopFilter, setShopFilter] = useState<{ category?: string } | null>(initial.category ? { category: initial.category } : null);

  useEffect(() => {
    const sync = () => {
      const next = readLocation();
      setPage(next.page);
      setProductId(next.productId);
      setShopFilter(next.category ? { category: next.category } : null);
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    };
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);

  const go: RouterState["go"] = (nextPage, opts) => {
    if (opts?.productId) setProductId(opts.productId);
    if (opts?.order) setLastOrder(opts.order);
    if (opts?.category !== undefined) setShopFilter({ category: opts.category });
    else if (nextPage === "shop" && !opts) setShopFilter(null);
    setPage(nextPage);
    const path = nextPage === "product" && opts?.productId
      ? `/product/${encodeURIComponent(opts.productId)}`
      : (SIMPLE_PATHS[nextPage] ?? "/");
    const query = nextPage === "shop" && opts?.category ? `?category=${encodeURIComponent(opts.category)}` : "";
    window.history.pushState(null, "", `#${path}${query}`);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  return (
    <RouterContext.Provider value={{ page, productId, lastOrder, shopFilter, go }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("useRouter must be used within RouterProvider");
  return ctx;
}
