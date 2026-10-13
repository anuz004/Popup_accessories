import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Banknote, Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { ProductVisual } from "@/components/ProductVisual";
import { DialEyebrow } from "@/components/DialEyebrow";
import { useProducts } from "@/context/ProductsContext";
import { useStore, formatINR, type Address } from "@/context/StoreContext";
import { useRouter } from "@/context/RouterContext";
import { toast } from "sonner";

const STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
  "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

const empty: Address = { firstName: "", lastName: "", phone: "", email: "", address: "", state: "", city: "", pincode: "" };

export function Checkout() {
  const { session, googleEnabled } = useAuth();
  const customer = session?.role === "customer" ? session : null;
  const { cart, cartSubtotal, cartDiscount, cartShipping, cartTotal, placeOrder } = useStore();
  const { products, bestPriceFor } = useProducts();
  const { go } = useRouter();
  const [form, setForm] = useState<Address>(() => ({ ...empty, email: customer?.email || "", firstName: customer?.name?.split(" ")[0] || "" }));
  useEffect(() => { if (customer) setForm(current => ({ ...current, email: customer.email, firstName: current.firstName || customer.name?.split(" ")[0] || "" })); }, [customer]);
  const [errors, setErrors] = useState<Partial<Record<keyof Address, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const lines = cart
    .map((l) => ({ product: products.find((p) => p.id === l.productId), qty: l.qty }))
    .filter((l): l is { product: (typeof products)[number]; qty: number } => !!l.product);

  const update = (key: keyof Address, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const e: Partial<Record<keyof Address, string>> = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!/^\d{10}$/.test(form.phone.trim())) e.phone = "Enter a 10-digit phone number";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "Enter a valid email";
    if (!form.address.trim()) e.address = "Required";
    if (!form.state) e.state = "Required";
    if (!form.city.trim()) e.city = "Required";
    if (!/^\d{6}$/.test(form.pincode.trim())) e.pincode = "Enter a 6-digit pincode";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (lines.length === 0) return;
    if (!validate()) return;
    setSubmitting(true);
    const { order, error } = await placeOrder(form);
    setSubmitting(false);
    if (error || !order) {
      toast.error(error ?? "Could not place order. Please try again.");
      return;
    }
    go("success", { order });
  };

  if (lines.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-5 md:px-8 pt-40 pb-32 text-center">
        <h1 className="font-display text-2xl text-white mb-3">Nothing to check out yet.</h1>
        <p className="text-white/45 text-sm mb-8">Add a piece to your bag before continuing.</p>
        <button onClick={() => go("shop")} className="inline-flex items-center gap-2 bg-gold text-[#0F0F10] rounded-full px-7 py-3 text-sm font-semibold uppercase tracking-wide hover:bg-[#e4c25c] transition-colors">
          Shop Collection <ArrowRight size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 pt-28 md:pt-32 pb-24">
      <DialEyebrow hour="VII" label="Checkout" />
      <h1 className="font-display text-3xl md:text-4xl text-white mb-10">Checkout</h1>

      <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/65">
        {customer ? `Signed in as ${customer.email}. Order updates will be sent to this email.` : <><p>Sign in with Google to save your orders. Order updates are sent by email.</p>{googleEnabled && <a href="/api/auth/google?returnTo=checkout" className="mt-2 inline-block text-gold hover:underline">Continue with Google</a>}</>}
      </div>
      <form onSubmit={submit} className="grid lg:grid-cols-[1fr_380px] gap-10">
        <div className="space-y-8">
          <section>
            <h2 className="text-white font-medium mb-4">Customer Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="First Name" value={form.firstName} onChange={(v) => update("firstName", v)} error={errors.firstName} />
              <Field label="Last Name" value={form.lastName} onChange={(v) => update("lastName", v)} error={errors.lastName} />
              <Field label="Phone Number" value={form.phone} onChange={(v) => update("phone", v.replace(/\D/g, "").slice(0, 10))} error={errors.phone} placeholder="10-digit mobile" />
              <Field label="Email" readOnly={Boolean(customer)} type="email" value={form.email} onChange={(v) => update("email", v)} error={errors.email} />
            </div>
          </section>

          <section>
            <h2 className="text-white font-medium mb-4">Shipping Address</h2>
            <div className="grid gap-4">
              <Field label="Address" value={form.address} onChange={(v) => update("address", v)} error={errors.address} />
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">State</label>
                  <select
                    aria-label="State"
                    value={form.state}
                    onChange={(e) => update("state", e.target.value)}
                    className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold/50 ${errors.state ? "border-red-500/60" : "border-white/10"}`}
                  >
                    <option value="" className="bg-[#111114]">Select state</option>
                    {STATES.map((s) => (
                      <option key={s} value={s} className="bg-[#111114]">{s}</option>
                    ))}
                  </select>
                  {errors.state && <p className="text-red-400 text-xs mt-1">{errors.state}</p>}
                </div>
                <Field label="City" value={form.city} onChange={(v) => update("city", v)} error={errors.city} />
                <Field label="Pincode" value={form.pincode} onChange={(v) => update("pincode", v.replace(/\D/g, "").slice(0, 6))} error={errors.pincode} />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-white font-medium mb-4">Payment Method</h2>
            <div className="flex items-center gap-3 bg-[#111114] border border-gold/40 rounded-2xl p-5">
              <span className="h-10 w-10 rounded-full bg-gold/15 flex items-center justify-center text-gold shrink-0">
                <Banknote size={18} />
              </span>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">Cash on Delivery</p>
                <p className="text-white/45 text-xs">Pay in cash when your order arrives at your door.</p>
              </div>
              <span className="h-4 w-4 rounded-full bg-gold flex items-center justify-center shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0F0F10]" />
              </span>
            </div>
            <p className="flex items-center gap-1.5 text-white/35 text-xs mt-3">
              <Lock size={12} /> No online payment gateway is used on this site — Cash on Delivery only.
            </p>
          </section>
        </div>

        <div className="lg:sticky lg:top-28 h-fit bg-[#111114] border border-white/[0.06] rounded-[20px] p-6">
          <h2 className="font-display text-lg text-white mb-5">Order Summary</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1 mb-5">
            {lines.map(({ product, qty }) => (
              <div key={product.id} className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 rounded-lg bg-gradient-to-b from-[#17181C] to-[#0b0b0c] p-1.5">
                  <ProductVisual product={product} className="w-full h-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs truncate">{product.name}</p>
                  <p className="text-white/40 text-[11px]">Qty {qty}</p>
                </div>
                <span className="text-white/80 text-xs shrink-0">{formatINR(bestPriceFor(product).price * qty)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2.5 text-sm border-t border-white/[0.06] pt-4 mb-4">
            <div className="flex justify-between text-white/60">
              <span>Subtotal</span>
              <span>{formatINR(cartSubtotal)}</span>
            </div>
            {cartDiscount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount</span>
                <span>-{formatINR(cartDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-white/60">
              <span>Shipping</span>
              <span>{cartShipping === 0 ? "Free" : formatINR(cartShipping)}</span>
            </div>
          </div>
          <div className="flex justify-between items-baseline pt-4 border-t border-white/[0.06] mb-6">
            <span className="text-white font-medium">Grand Total</span>
            <span className="text-white font-display text-xl">{formatINR(cartTotal)}</span>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-gold text-[#0F0F10] rounded-full py-3.5 text-sm font-semibold uppercase tracking-wide hover:bg-[#e4c25c] transition-colors disabled:opacity-60"
          >
            {submitting ? (
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} className="h-4 w-4 border-2 border-[#0F0F10]/30 border-t-[#0F0F10] rounded-full" />
            ) : (
              <>
                Place Order <ArrowRight size={15} />
              </>
            )}
          </button>
          <p className="flex items-center justify-center gap-1.5 text-white/30 text-xs mt-4">
            <ShieldCheck size={13} /> Your information is used only to deliver this order.
          </p>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="text-xs text-white/50 mb-1.5 block">{label}</label>
      <input
        readOnly={readOnly}
        aria-label={label}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-gold/50 ${
          error ? "border-red-500/60" : "border-white/10"
        }`}
      />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
