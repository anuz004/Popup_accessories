import { BrandLogo } from "@/components/BrandLogo";
import { useState } from "react";
import { MapPin, Phone, Mail } from "lucide-react";

import { useRouter } from "@/context/RouterContext";
import { toast } from "sonner";
import { subscribeNewsletter } from "@/lib/customerMessages";
import { siteConfig } from "@/lib/siteConfig";

export function Footer() {
  const { go } = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <footer className="bg-[#0b0b0c] border-t border-white/[0.06] pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="grid md:grid-cols-[1.4fr_1fr_1fr_1.2fr] gap-12 mb-16">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BrandLogo className="w-[230px] max-w-full" />
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs mb-6">
              Your trusted destination for premium watches and fashion accessories in the heart of Coimbatore.
            </p>
          </div>

          <div>
            <p className="text-white text-sm font-medium mb-4 tracking-wide">Shop</p>
            <ul className="space-y-3 text-sm text-white/50">
              {["Luxury", "Sport", "Classic", "Smart", "Limited Edition"].map((c) => (
                <li key={c}>
                  <button onClick={() => go("shop", { category: c })} className="hover:text-gold transition-colors">
                    {c} Watches
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-white text-sm font-medium mb-4 tracking-wide">Company</p>
            <ul className="space-y-3 text-sm text-white/50">
              <li><button onClick={() => go("about")} className="hover:text-gold transition-colors">Our Story</button></li>
              <li><button onClick={() => go("contact")} className="hover:text-gold transition-colors">Contact</button></li>
              <li><button onClick={() => go("faq")} className="hover:text-gold transition-colors">FAQ</button></li>
              <li><button onClick={() => go("warranty")} className="hover:text-gold transition-colors">Warranty</button></li>
              <li><button onClick={() => go("returns")} className="hover:text-gold transition-colors">Returns</button></li>
            </ul>
          </div>

          <div>
            <p className="text-white text-sm font-medium mb-4 tracking-wide">Newsletter</p>
            <p className="text-white/50 text-sm mb-4">New arrivals and offers, straight to your inbox.</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSubmitting(true);
                const { error } = await subscribeNewsletter(email);
                setSubmitting(false);
                if (error) return toast.error(`Could not subscribe: ${error}`);
                toast.success("You're on the list");
                setEmail("");
              }}
              className="flex gap-2"
            >
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="Email address"
                className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-gold/50"
              />
              <button disabled={submitting} className="shrink-0 bg-gold text-[#0F0F10] rounded-full px-4 py-2.5 text-xs font-semibold uppercase tracking-wide hover:bg-[#e4c25c] transition-colors disabled:opacity-60">
                {submitting ? "Joining…" : "Join"}
              </button>
            </form>
            <div className="mt-6 space-y-2 text-xs text-white/40">
              <div className="flex items-start gap-2"><MapPin size={13} className="mt-0.5 shrink-0" /> {siteConfig.address}</div>
              {siteConfig.phone && <div className="flex items-center gap-2"><Phone size={13} /> <a href={`tel:${siteConfig.phone}`} className="hover:text-gold">{siteConfig.phone}</a></div>}
              {siteConfig.email && <div className="flex items-center gap-2"><Mail size={13} /> <a href={`mailto:${siteConfig.email}`} className="hover:text-gold">{siteConfig.email}</a></div>}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/[0.06] flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/35">
          <p>© 2026 Grand Hour. All rights reserved.</p>
          <div className="flex gap-6">
            <button onClick={() => go("privacy")} className="hover:text-white/70">Privacy Policy</button>
            <button onClick={() => go("terms")} className="hover:text-white/70">Terms of Service</button>
            <button onClick={() => go("admin")} className="hover:text-white/70">Admin</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
