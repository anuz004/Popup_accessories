import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, X, Loader2, Tag } from "lucide-react";
import { database } from "@/lib/api";
import { toast } from "sonner";
import { useProducts } from "@/context/ProductsContext";

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

const CATEGORIES = ["Classic", "Sport", "Luxury", "Smart", "Limited Edition"];

const emptyForm = {
  title: "",
  code: "",
  discount_type: "percent",
  discount_value: 10,
  scope: "all",
  target: "",
  active: true,
};

export function OffersTab() {
  const { products, refresh } = useProducts();
  const [rows, setRows] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await database.from("offers").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as OfferRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setForm(emptyForm);
    setFormOpen(true);
  };

  const save = async () => {
    if (!form.title.trim() || form.discount_value <= 0) {
      toast.error("Title and a discount value above 0 are required");
      return;
    }
    if (form.scope !== "all" && !form.target.trim()) {
      toast.error("Choose a category or product for this offer's scope");
      return;
    }
    setSaving(true);
    const { error } = await database.from("offers").insert({
      title: form.title.trim(),
      code: form.code.trim() ? form.code.trim().toUpperCase() : null,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      scope: form.scope,
      target: form.scope === "all" ? null : form.target.trim(),
      active: form.active,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "That coupon code is already in use" : error.message);
      return;
    }
    toast.success("Offer created");
    setFormOpen(false);
    load();
    await refresh();
  };

  const remove = async (r: OfferRow) => {
    if (!confirm(`Delete offer "${r.title}"?`)) return;
    const { error } = await database.from("offers").delete().eq("id", r.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((prev) => prev.filter((o) => o.id !== r.id));
    toast.success("Offer deleted");
    await refresh();
  };

  const toggleActive = async (r: OfferRow) => {
    const { error } = await database.from("offers").update({ active: !r.active }).eq("id", r.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((prev) => prev.map((o) => (o.id === r.id ? { ...o, active: !o.active } : o)));
    await refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-white mb-1">Offers &amp; Discounts</h1>
          <p className="text-white/40 text-sm">Coupon codes apply at checkout; codeless offers apply automatically storewide or on a category/product.</p>
        </div>
        <button
          onClick={openAdd}
          className="shrink-0 flex items-center gap-2 bg-gold text-[#0F0F10] rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wide hover:bg-[#e4c25c] transition-colors"
        >
          <Plus size={14} /> New Offer
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-white/40 text-sm py-12 justify-center">
          <Loader2 size={16} className="animate-spin" /> Loading offers…
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center gap-4 bg-[#111114] border border-white/[0.06] rounded-2xl p-4">
              <span className="h-9 w-9 rounded-full bg-gold/15 flex items-center justify-center text-gold shrink-0">
                <Tag size={15} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm">{r.title}</p>
                <p className="text-white/40 text-xs">
                  {r.discount_type === "percent" ? `${r.discount_value}% off` : `₹${r.discount_value} off`} &middot;{" "}
                  {r.scope === "all" ? "Storewide" : `${r.scope === "category" ? "Category" : "Product"}: ${r.target}`}
                  {r.code ? ` · Code ${r.code}` : " · Automatic"}
                </p>
              </div>
              <button
                onClick={() => toggleActive(r)}
                className={`shrink-0 text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-full border transition-colors ${
                  r.active ? "border-emerald-500/40 text-emerald-400" : "border-white/15 text-white/40"
                }`}
              >
                {r.active ? "Active" : "Paused"}
              </button>
              <button aria-label={`Delete ${r.title}`} onClick={() => remove(r)} className="h-8 w-8 shrink-0 flex items-center justify-center rounded-full hover:bg-white/5 text-white/60 hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {rows.length === 0 && <p className="text-white/40 text-sm text-center py-12">No offers yet — create one to run a promotion.</p>}
        </div>
      )}

      <AnimatePresence>
        {formOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setFormOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#111114] border border-white/10 rounded-[20px] w-full max-w-md p-6 md:p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl text-white">New Offer</h2>
                <button onClick={() => setFormOpen(false)} className="text-white/40 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">Title (shown to customers)</label>
                  <input
                    aria-label="Title" value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Festive Sale"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">Coupon code (leave blank to apply automatically)</label>
                  <input
                    aria-label="Coupon code" value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                    placeholder="e.g. FESTIVE10"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-gold/50 uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">Discount Type</label>
                    <select
                      aria-label="Discount Type" value={form.discount_type}
                      onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-gold/50"
                    >
                      <option value="percent" className="bg-[#111114]">Percent %</option>
                      <option value="flat" className="bg-[#111114]">Flat ₹ Amount</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">Value</label>
                    <input
                      type="number"
                      aria-label="Value" value={form.discount_value}
                      onChange={(e) => setForm((f) => ({ ...f, discount_value: Number(e.target.value) }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-gold/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">Applies To</label>
                  <select
                    aria-label="Applies To" value={form.scope}
                    onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value, target: "" }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-gold/50"
                  >
                    <option value="all" className="bg-[#111114]">Entire Store</option>
                    <option value="category" className="bg-[#111114]">One Category</option>
                    <option value="product" className="bg-[#111114]">One Product</option>
                  </select>
                </div>

                {form.scope === "category" && (
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">Category</label>
                    <select
                      aria-label="Target" value={form.target}
                      onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-gold/50"
                    >
                      <option value="" className="bg-[#111114]">Select category</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c} className="bg-[#111114]">{c}</option>
                      ))}
                    </select>
                  </div>
                )}

                {form.scope === "product" && (
                  <div>
                    <label className="text-xs text-white/50 mb-1.5 block">Product</label>
                    <select
                      aria-label="Target" value={form.target}
                      onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-gold/50"
                    >
                      <option value="" className="bg-[#111114]">Select product</option>
                      {products.filter((p) => !p.id.startsWith("demo-")).map((p) => (
                        <option key={p.id} value={p.id} className="bg-[#111114]">{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="accent-[#D4AF37] h-4 w-4" />
                  <span className="text-sm text-white/70">Active immediately</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setFormOpen(false)} className="px-5 py-2.5 rounded-full text-sm text-white/60 hover:text-white transition-colors">
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex items-center gap-2 bg-gold text-[#0F0F10] rounded-full px-6 py-2.5 text-sm font-semibold uppercase tracking-wide hover:bg-[#e4c25c] transition-colors disabled:opacity-60"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  Create Offer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
