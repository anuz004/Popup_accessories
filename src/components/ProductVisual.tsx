import { useState } from "react";
import { WatchArt } from "@/components/WatchArt";
import type { Product } from "@/data/products";

export function ProductVisual({ product, className = "", animated = false }: { product: Product; className?: string; animated?: boolean }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (product.imageUrl && failedUrl !== product.imageUrl) {
    return <img src={product.imageUrl} alt={product.name} loading="lazy" onError={() => setFailedUrl(product.imageUrl ?? null)} className={`object-contain ${className}`} />;
  }
  return <WatchArt style={product.style} caseColor={product.caseColor} dialColor={product.dialColor} accent={product.accent} animated={animated} className={className} />;
}
