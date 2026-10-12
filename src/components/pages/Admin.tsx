import { useState } from "react";
import { motion } from "framer-motion";
import { Watch, LayoutGrid, Tag, Package, LogOut, ExternalLink, Loader2, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/context/ProductsContext";
import { useRouter } from "@/context/RouterContext";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { ProductsTab } from "@/components/admin/ProductsTab";
import { OffersTab } from "@/components/admin/OffersTab";
import { OrdersTab } from "@/components/admin/OrdersTab";
import { InboxTab } from "@/components/admin/InboxTab";

type Tab = "products" | "offers" | "orders" | "inbox";

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: "products", label: "Products", icon: LayoutGrid },
  { key: "offers", label: "Offers", icon: Tag },
  { key: "orders", label: "Orders", icon: Package },
  { key: "inbox", label: "Inbox", icon: Mail },
];

export function Admin() {
  const { session, isAdmin, loading, signOut } = useAuth();
  const { refresh } = useProducts();
  const { go } = useRouter();
  const [tab, setTab] = useState<Tab>("products");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080808] text-white/40">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  if (!session || !isAdmin) return <AdminLogin />;

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-white/[0.06] flex lg:flex-col">
        <div className="hidden lg:flex items-center gap-2 px-6 h-20 border-b border-white/[0.06]">
          <Watch size={20} className="text-gold" strokeWidth={1.5} />
          <span className="font-display text-sm tracking-[0.1em] text-white">POPUP ADMIN</span>
        </div>
        <nav className="flex lg:flex-col flex-1 px-3 lg:py-4 gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm shrink-0 transition-colors ${
                tab === t.key ? "bg-gold/10 text-gold" : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </nav>
        <div className="hidden lg:block p-3 border-t border-white/[0.06] space-y-1">
          <button
            onClick={() => {
              refresh();
              go("home");
            }}
            className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ExternalLink size={16} /> View Store
          </button>
          <button onClick={signOut} className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm text-white/60 hover:text-red-400 hover:bg-white/5 transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-5 md:p-10 max-w-5xl">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          {tab === "products" && <ProductsTab />}
          {tab === "offers" && <OffersTab />}
          {tab === "orders" && <OrdersTab />}
          {tab === "inbox" && <InboxTab />}
        </motion.div>
      </main>

      {/* Mobile bottom actions */}
      <div className="lg:hidden flex border-t border-white/[0.06]">
        <button
          onClick={() => {
            refresh();
            go("home");
          }}
          className="flex-1 flex items-center justify-center gap-2 py-4 text-sm text-white/60"
        >
          <ExternalLink size={15} /> View Store
        </button>
        <button onClick={signOut} className="flex-1 flex items-center justify-center gap-2 py-4 text-sm text-white/60 border-l border-white/[0.06]">
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  );
}
