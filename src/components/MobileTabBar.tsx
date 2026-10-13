import { motion } from "framer-motion";
import { Home, LayoutGrid, Heart, ShoppingBag, User } from "lucide-react";
import { useRouter } from "@/context/RouterContext";
import { useStore } from "@/context/StoreContext";

export function MobileTabBar() {
  const { page, go } = useRouter();
  const { cartCount, wishlist } = useStore();

  const tabs = [
    { key: "home", label: "Home", icon: Home, onPress: () => go("home") },
    { key: "shop", label: "Shop", icon: LayoutGrid, onPress: () => go("shop") },
    { key: "wishlist", label: "Wishlist", icon: Heart, badge: wishlist.length, onPress: () => go("wishlist") },
    { key: "cart", label: "Bag", icon: ShoppingBag, badge: cartCount, onPress: () => go("cart") },
    { key: "account", label: "Account", icon: User, onPress: () => go("account") },
  ] as const;

  const isActive = (key: string) => {
    if (key === "home") return page === "home";
    if (key === "shop") return page === "shop" || page === "product";
    if (key === "wishlist") return page === "wishlist";
    if (key === "cart") return page === "cart" || page === "checkout" || page === "success";
    if (key === "account") return page === "account";
    return false;
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0b0b0c]/95 backdrop-blur-md border-t border-white/10"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="grid grid-cols-5">
        {tabs.map((tab) => {
          const active = isActive(tab.key);
          return (
            <motion.button
              key={tab.key}
              onClick={tab.onPress}
              whileTap={{ scale: 0.88 }}
              className="relative flex flex-col items-center justify-center gap-1 py-2.5"
            >
              <span className="relative">
                <tab.icon
                  size={20}
                  strokeWidth={active ? 2.2 : 1.6}
                  className={active ? "text-gold" : "text-white/55"}
                />
                {"badge" in tab && tab.badge! > 0 && (
                  <span className="absolute -top-1.5 -right-2 h-3.5 w-3.5 rounded-full bg-gold text-[8px] font-bold text-[#0F0F10] flex items-center justify-center">
                    {tab.badge! > 9 ? "9+" : tab.badge}
                  </span>
                )}
              </span>
              <span className={`text-[10px] ${active ? "text-gold" : "text-white/45"}`}>{tab.label}</span>
              {active && (
                <motion.span
                  layoutId="tab-underline"
                  className="absolute -top-px inset-x-6 h-[2px] bg-gold rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
