import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

export function AnimatedCounter({ to, suffix = "", prefix = "", duration = 1.6 }: { to: number; suffix?: string; prefix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start: number | null = null;
    let raf: number;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * to));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);

  return (
    <motion.span ref={ref} initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}>
      {prefix}
      {value.toLocaleString("en-IN")}
      {suffix}
    </motion.span>
  );
}
