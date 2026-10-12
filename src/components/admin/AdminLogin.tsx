import { demoCredentials } from "@/lib/localDatabase";
import { BrandLogo } from "@/components/BrandLogo";
import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { localDemoMode } from "@/lib/supabase";

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
    try {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } catch {
      setError("Unable to connect. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
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
          <BrandLogo className="w-[240px] max-w-full" />
        </div>
        <p className="text-center text-white/40 text-xs uppercase tracking-luxe mb-8">Admin Sign In</p>
        {localDemoMode && (
          <p className="mb-6 rounded-xl border border-gold/20 bg-gold/5 p-3 text-sm text-gold" role="status">
            Local demo sign-in<br />
            Email: {demoCredentials.email}<br />
            Password: {demoCredentials.password}
          </p>
        )}

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
