import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from "lucide-react";
import { DialEyebrow } from "@/components/DialEyebrow";
import { toast } from "sonner";
import { sendContactMessage } from "@/lib/customerMessages";
import { siteConfig } from "@/lib/siteConfig";

const ADDRESS = siteConfig.address;
const MAP_SRC = `https://www.google.com/maps?q=${encodeURIComponent(ADDRESS)}&output=embed`;

export function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !/^\S+@\S+\.\S+$/.test(form.email) || !form.message.trim()) {
      toast.error("Please fill in your name, a valid email, and a message");
      return;
    }
    setSubmitting(true);
    const { error } = await sendContactMessage(form);
    setSubmitting(false);
    if (error) {
      toast.error(`Message could not be sent: ${error}`);
      return;
    }
    setSent(true);
    toast.success("Message sent — we'll get back to you soon");
  };

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 pt-28 md:pt-36 pb-24">
      <DialEyebrow hour="X" label="Get In Touch" />
      <h1 className="font-display text-4xl md:text-5xl text-white mb-4">Visit or Write to Us</h1>
      <p className="text-white/50 text-sm max-w-xl mb-14">
        Drop by our Coimbatore store to see the collection in person, or send a message and we'll get back to you.
      </p>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-12">
        <div className="space-y-8">
          <div className="grid sm:grid-cols-2 gap-4">
            <InfoCard icon={MapPin} label="Store Address">
              H.R Complex, Prakasam Bus Stop, Oppanakara Street, Near AB Lodge, Town Hall, Coimbatore, Tamil Nadu 641001, India
            </InfoCard>
            <InfoCard icon={Clock} label="Working Hours">
              {siteConfig.hours ?? "Please contact the store to confirm today's hours."}
            </InfoCard>
            <InfoCard icon={Phone} label="Phone">
              {siteConfig.phone ? <a className="hover:text-gold" href={`tel:${siteConfig.phone}`}>{siteConfig.phone}</a> : "Phone number coming soon"}
            </InfoCard>
            <InfoCard icon={Mail} label="Email">
              {siteConfig.email ? <a className="hover:text-gold" href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> : "Use the contact form"}
            </InfoCard>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-[20px] overflow-hidden border border-white/[0.06] h-72 md:h-80"
          >
            <iframe
              title="Popup Accessories location"
              src={MAP_SRC}
              width="100%"
              height="100%"
              style={{ border: 0, filter: "grayscale(0.3) invert(0.92) contrast(0.9)" }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-[#111114] border border-white/[0.06] rounded-[20px] p-7 md:p-8 h-fit"
        >
          {sent ? (
            <div className="text-center py-10">
              <CheckCircle2 size={34} className="text-gold mx-auto mb-4" />
              <p className="text-white font-display text-xl mb-2">Message sent</p>
              <p className="text-white/50 text-sm">Thanks for reaching out — we'll reply as soon as we can.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <h2 className="font-display text-xl text-white mb-1">Send us a message</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Your Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
                <Field label="Phone (optional)" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
              </div>
              <Field label="Email" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
              <div>
                <label className="text-xs text-white/50 mb-1.5 block">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  rows={5}
                  placeholder="How can we help?"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-gold/50 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-gold text-[#0F0F10] rounded-full py-3.5 text-sm font-semibold uppercase tracking-wide hover:bg-[#e4c25c] transition-colors disabled:opacity-60"
              >
                <Send size={14} /> {submitting ? "Sending…" : "Send Message"}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[20px] bg-[#111114] border border-white/[0.06] p-5">
      <Icon size={18} className="text-gold mb-3" strokeWidth={1.5} />
      <p className="text-white text-xs uppercase tracking-wide mb-1.5">{label}</p>
      <p className="text-white/55 text-sm leading-relaxed">{children}</p>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs text-white/50 mb-1.5 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-gold/50"
      />
    </div>
  );
}
