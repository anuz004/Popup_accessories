import { useState } from "react";
import { motion } from "framer-motion";
import { Watch, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function AdminLogin() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) setError(error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 bg-[#080808]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm bg-[#111114] border border-white/10 rounded-[20px] p-8"
      >
        <div className="flex items-center gap-2 justify-center mb-6">
          <Watch size={22} className="text-gold" strokeWidth={1.5} />
          <span className="font-display text-lg tracking-[0.12em] text-white">POPUP ACCESSORIES</span>
        </div>
        <p className="text-center text-white/40 text-xs uppercase tracking-luxe mb-8">Admin Sign In</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold/50"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold/50"
            />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-gold text-[#0F0F10] rounded-full py-3 text-sm font-semibold uppercase tracking-wide hover:bg-[#e4c25c] transition-colors disabled:opacity-60"
          >
            {submitting ? (
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} className="h-4 w-4 border-2 border-[#0F0F10]/30 border-t-[#0F0F10] rounded-full" />
            ) : (
              <>
                <Lock size={14} /> Sign In <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
