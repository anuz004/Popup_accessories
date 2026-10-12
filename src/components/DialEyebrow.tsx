import { motion } from "framer-motion";

/**
 * Signature structural device: instead of generic 01 / 02 / 03 numbering,
 * each major section is labelled with its position on a watch dial —
 * a motif drawn directly from the product itself.
 */
export function DialEyebrow({ hour, label }: { hour: string; label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-3 mb-4"
    >
      <span className="relative flex h-8 w-8 items-center justify-center rounded-full border border-gold/40">
        <span className="absolute h-1 w-1 rounded-full bg-gold" />
        <span
          className="absolute h-2.5 w-[1.5px] bg-gold origin-bottom"
          style={{ top: "3px" }}
        />
      </span>
      <span className="text-gold text-xs tracking-luxe uppercase font-medium">
        {hour} &middot; {label}
      </span>
    </motion.div>
  );
}
