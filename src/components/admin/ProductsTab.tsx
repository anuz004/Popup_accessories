import { prepareProductPhoto } from "@/lib/productPhotos";
import { requestApi } from "@/lib/api";
import { useProducts } from "@/context/ProductsContext";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { database } from "@/lib/api";
import { WatchArt } from "@/components/WatchArt";
import { formatINR } from "@/context/StoreContext";
import { toast } from "sonner";

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
  image_urls?: string[];
  active: boolean;
}

const CATEGORIES = ["Classic", "Sport", "Luxury", "Smart", "Limited Edition"];
const GENDERS = ["Men", "Women", "Unisex"];
const MOVEMENTS = ["Automatic", "Quartz", "Smart OS"];
const STYLES = ["classic", "sport", "smart", "diamond", "minimal"];
const BADGES = ["", "New", "Bestseller", "Limited", "-15%"];

const emptyForm = {
  name: "",
  line: "",
  category: "Classic",
  gender: "Unisex",
  price: 0,
  original_price: "" as number | "",
  badge: "",
  style: "classic",
  case_color: "#C9A961",
  dial_color: "#0F0F10",
  accent: "#D4AF37",
  movement: "Automatic",
  water_resistance: "30m",
  dial: "",
  case_material: "",
  strap_material: "",
  case_size: "",
  description: "",
  short: "",
  image_urls: [] as string[],
  active: true,
};

export function ProductsTab() {
  const { refresh } = useProducts();
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [photoUrl, setPhotoUrl] = useState("");
  const [preparingPhotos, setPreparingPhotos] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await database.from("products").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as ProductRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setPhotoUrl("");
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (r: ProductRow) => {
    setPhotoUrl("");
    setEditingId(r.id);
    setForm({
      name: r.name,
      line: r.line,
      category: r.category,
      gender: r.gender,
      price: r.price,
      original_price: r.original_price ?? "",
      badge: r.badge ?? "",
      style: r.style,
      case_color: r.case_color,
      dial_color: r.dial_color,
      accent: r.accent,
      movement: r.movement,
      water_resistance: r.water_resistance ?? "",
      dial: r.dial ?? "",
      case_material: r.case_material ?? "",
      strap_material: r.strap_material ?? "",
      case_size: r.case_size ?? "",
      description: r.description ?? "",
      short: r.short ?? "",
      image_urls: r.image_urls?.length ? r.image_urls : r.image_url ? [r.image_url] : [],
      active: r.active,
    });
    setFormOpen(true);
  };

  const addPhotos = async (files: File[]) => {
    if (files.length + form.image_urls.length > 5) return toast.error("You can add up to five photos per product.");
    setPreparingPhotos(true);
    try {
      const photos = await Promise.all(files.map(prepareProductPhoto));
      setForm(current => ({ ...current, image_urls: [...current.image_urls, ...photos].slice(0, 5) }));
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not open these photos."); }
    finally { setPreparingPhotos(false); }
  };

  const save = async () => {
    if (!form.name.trim() || !form.line.trim() || form.price <= 0) {
      toast.error("Name, collection, and a price above 0 are required");
      return;
    }
    setSaving(true);
    const photos: string[] = [];
    for (const [index, photo] of form.image_urls.entries()) {
      if (!photo.startsWith("data:")) { photos.push(photo); continue; }
      const { data, error } = await requestApi("/product-images", { method: "POST", body: JSON.stringify({ dataUrl: photo }) });
      if (error) { setSaving(false); toast.error(error.message); return; }
      photos.push(data.url);
      setForm(current => ({ ...current, image_urls: current.image_urls.map((value, i) => i === index ? data.url : value) }));
    }
    const payload = {
      name: form.name.trim(),
      line: form.line.trim(),
      category: form.category,
      gender: form.gender,
      price: Math.round(Number(form.price)),
      original_price: form.original_price === "" ? null : Math.round(Number(form.original_price)),
      badge: form.badge || null,
      style: form.style,
      case_color: form.case_color,
      dial_color: form.dial_color,
      accent: form.accent,
      movement: form.movement,
      water_resistance: form.water_resistance,
      dial: form.dial,
      case_material: form.case_material,
      strap_material: form.strap_material,
      case_size: form.case_size,
      description: form.description,
      short: form.short,
      image_url: photos[0] || null,
      image_urls: photos,
      active: form.active,
      updated_at: new Date().toISOString(),
    };

    const { error } = editingId
      ? await database.from("products").update(payload).eq("id", editingId)
      : await database.from("products").insert(payload);

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editingId ? "Product updated" : "Product added");
    setFormOpen(false);
    load();
    await refresh();
  };

  const remove = async (r: ProductRow) => {
    if (!confirm(`Delete "${r.name}"? This can't be undone.`)) return;
    const { error } = await database.from("products").delete().eq("id", r.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Product deleted");
    setRows((prev) => prev.filter((p) => p.id !== r.id));
    await refresh();
  };

  const toggleActive = async (r: ProductRow) => {
    const { error } = await database.from("products").update({ active: !r.active }).eq("id", r.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((prev) => prev.map((p) => (p.id === r.id ? { ...p, active: !p.active } : p)));
    await refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-white mb-1">Products</h1>
          <p className="text-white/40 text-sm">{rows.length} total &middot; {rows.filter((r) => r.active).length} live on the store</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-gold text-[#0F0F10] rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wide hover:bg-[#e4c25c] transition-colors"
        >
          <Plus size={14} /> Add Product
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-white/40 text-sm py-12 justify-center">
          <Loader2 size={16} className="animate-spin" /> Loading products…
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center gap-4 bg-[#111114] border border-white/[0.06] rounded-2xl p-3">
              <div className="h-14 w-14 shrink-0 rounded-xl bg-gradient-to-b from-[#17181C] to-[#0b0b0c] p-2">
                {r.image_urls?.[0] || r.image_url ? <img src={r.image_urls?.[0] || r.image_url!} alt={r.name} className="w-full h-full object-contain" /> : <WatchArt style={r.style as any} caseColor={r.case_color} dialColor={r.dial_color} accent={r.accent} animated={false} className="w-full h-full" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm truncate">{r.name}</p>
                <p className="text-white/40 text-xs">{r.line} &middot; {r.category} &middot; {r.gender}</p>
              </div>
              <div className="text-right shrink-0 hidden sm:block">
                <p className="text-white text-sm">{formatINR(r.price)}</p>
                {r.original_price && <p className="text-white/35 text-xs line-through">{formatINR(r.original_price)}</p>}
              </div>
              {r.badge && (
                <span className="hidden md:inline-block text-[10px] uppercase tracking-wide bg-gold/15 text-gold px-2.5 py-1 rounded-full shrink-0">{r.badge}</span>
              )}
              <button
                onClick={() => toggleActive(r)}
                className={`shrink-0 text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-full border transition-colors ${
                  r.active ? "border-emerald-500/40 text-emerald-400" : "border-white/15 text-white/40"
                }`}
              >
                {r.active ? "Live" : "Hidden"}
              </button>
              <div className="flex items-center gap-1 shrink-0">
                <button aria-label={`Edit ${r.name}`} onClick={() => openEdit(r)} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-white/5 text-white/60 hover:text-gold transition-colors">
                  <Pencil size={14} />
                </button>
                <button aria-label={`Delete ${r.name}`} onClick={() => remove(r)} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-white/5 text-white/60 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {rows.length === 0 && <p className="text-white/40 text-sm text-center py-12">No products yet — add your first one.</p>}
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
              className="bg-[#111114] border border-white/10 rounded-[20px] w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 md:p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl text-white">{editingId ? "Edit Product" : "Add Product"}</h2>
                <button onClick={() => setFormOpen(false)} className="text-white/40 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <TextField label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
                <TextField label="Collection (line)" value={form.line} onChange={(v) => setForm((f) => ({ ...f, line: v }))} />

                <SelectField label="Category" value={form.category} options={CATEGORIES} onChange={(v) => setForm((f) => ({ ...f, category: v }))} />
                <SelectField label="Gender" value={form.gender} options={GENDERS} onChange={(v) => setForm((f) => ({ ...f, gender: v }))} />

                <NumberField label="Price (₹)" value={form.price} onChange={(v) => setForm((f) => ({ ...f, price: v === "" ? 0 : v }))} />
                <NumberField
                  label="Original / Compare-at Price (optional)"
                  value={form.original_price}
                  onChange={(v) => setForm((f) => ({ ...f, original_price: v }))}
                  allowEmpty
                />

                <SelectField label="Badge" value={form.badge} options={BADGES} onChange={(v) => setForm((f) => ({ ...f, badge: v }))} labelForEmpty="None" />
                <SelectField label="Visual Style" value={form.style} options={STYLES} onChange={(v) => setForm((f) => ({ ...f, style: v }))} />

                <SelectField label="Movement" value={form.movement} options={MOVEMENTS} onChange={(v) => setForm((f) => ({ ...f, movement: v }))} />
                <TextField label="Water Resistance" value={form.water_resistance} onChange={(v) => setForm((f) => ({ ...f, water_resistance: v }))} />

                <TextField label="Dial" value={form.dial} onChange={(v) => setForm((f) => ({ ...f, dial: v }))} />
                <TextField label="Case Size" value={form.case_size} onChange={(v) => setForm((f) => ({ ...f, case_size: v }))} />
                <TextField label="Case Material" value={form.case_material} onChange={(v) => setForm((f) => ({ ...f, case_material: v }))} />
                <TextField label="Strap Material" value={form.strap_material} onChange={(v) => setForm((f) => ({ ...f, strap_material: v }))} />

                <ColorField label="Case Color" value={form.case_color} onChange={(v) => setForm((f) => ({ ...f, case_color: v }))} />
                <ColorField label="Dial Color" value={form.dial_color} onChange={(v) => setForm((f) => ({ ...f, dial_color: v }))} />
                <ColorField label="Accent Color" value={form.accent} onChange={(v) => setForm((f) => ({ ...f, accent: v }))} />

                <label className="flex items-center gap-2.5 cursor-pointer self-end pb-2.5">
                  <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="accent-[#D4AF37] h-4 w-4" />
                  <span className="text-sm text-white/70">Visible on the storefront</span>
                </label>
              </div>

              <section className="mt-6">
                <h3 className="text-sm text-white mb-2">Product photos ({form.image_urls.length}/5)</h3>
                <p className="text-xs text-white/45 mb-3">Add up to five JPG, PNG, or WebP photos. The first photo is the cover shown on the website.</p>
                <input aria-label="Upload product photos" type="file" accept="image/jpeg,image/png,image/webp" multiple
                  disabled={saving || preparingPhotos || form.image_urls.length >= 5}
                  onChange={event => { const files = Array.from(event.target.files ?? []); event.target.value = ""; void addPhotos(files); }}
                  className="w-full text-xs text-white/60 file:mr-3 file:rounded-full file:border-0 file:bg-gold file:px-4 file:py-2 file:text-black disabled:opacity-50" />
                {preparingPhotos && <p className="mt-2 text-xs text-gold">Preparing photos…</p>}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
                  {form.image_urls.map((photo, index) => (
                    <div key={`${index}-${photo.slice(-30)}`} className="relative">
                      <img src={photo} alt={`Product photo ${index + 1}`} className="aspect-square w-full rounded-lg bg-white/5 object-contain" />
                      <button aria-label={`Remove photo ${index + 1}`} disabled={saving} onClick={() => setForm(current => ({ ...current, image_urls: current.image_urls.filter((_, i) => i !== index) }))}
                        className="absolute right-1 top-1 rounded-full bg-black/75 p-1 text-white"><X size={12} /></button>
                      {index === 0 ? <p className="mt-1 text-xs text-gold">Cover photo</p> : <button disabled={saving} className="mt-1 text-xs text-white/60 hover:text-gold" aria-label={`Use photo ${index + 1} as cover`}
                        onClick={() => setForm(current => ({ ...current, image_urls: [current.image_urls[index], ...current.image_urls.filter((_, i) => i !== index)] }))}>Set as cover</button>}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-end gap-2">
                  <div className="flex-1"><TextField label="Or add a photo URL" value={photoUrl} onChange={setPhotoUrl} /></div>
                  <button disabled={saving || preparingPhotos || form.image_urls.length >= 5} className="rounded-full border border-gold/40 px-4 py-2.5 text-xs text-gold disabled:opacity-40"
                    onClick={() => { if (!/^https?:\/\//i.test(photoUrl.trim())) return toast.error("Enter an HTTP or HTTPS photo URL."); setForm(current => ({ ...current, image_urls: [...current.image_urls, photoUrl.trim()].slice(0, 5) })); setPhotoUrl(""); }}>Add photo URL</button>
                </div>
              </section>
              <div className="mt-4">
                <label className="text-xs text-white/50 mb-1.5 block">Short description (used on cards)</label>
                <input
                  value={form.short}
                  onChange={(e) => setForm((f) => ({ ...f, short: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold/50"
                />
              </div>
              <div className="mt-4">
                <label className="text-xs text-white/50 mb-1.5 block">Full description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold/50 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setFormOpen(false)} className="px-5 py-2.5 rounded-full text-sm text-white/60 hover:text-white transition-colors">
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={saving || preparingPhotos}
                  className="flex items-center gap-2 bg-gold text-[#0F0F10] rounded-full px-6 py-2.5 text-sm font-semibold uppercase tracking-wide hover:bg-[#e4c25c] transition-colors disabled:opacity-60"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {editingId ? "Save Changes" : "Add Product"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-white/50 mb-1.5 block">{label}</label>
      <input aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-gold/50" />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  allowEmpty = false,
}: {
  label: string;
  value: number | "";
  onChange: (v: number | "") => void;
  allowEmpty?: boolean;
}) {
  return (
    <div>
      <label className="text-xs text-white/50 mb-1.5 block">{label}</label>
      <input
        aria-label={label}
        type="number"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "" && allowEmpty) onChange("");
          else onChange(Number(v));
        }}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-gold/50"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  labelForEmpty,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  labelForEmpty?: string;
}) {
  return (
    <div>
      <label className="text-xs text-white/50 mb-1.5 block">{label}</label>
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-gold/50">
        {options.map((o) => (
          <option key={o} value={o} className="bg-[#111114]">
            {o === "" ? labelForEmpty ?? "" : o}
          </option>
        ))}
      </select>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-white/50 mb-1.5 block">{label}</label>
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-6 w-6 rounded shrink-0 bg-transparent" />
        <input aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent text-sm text-white outline-none" />
      </div>
    </div>
  );
}
