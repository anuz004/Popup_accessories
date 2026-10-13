import { useState } from "react";
import { WatchArt } from "@/components/WatchArt";
import type { Product } from "@/data/products";

export function ProductVisual({ product, className = "", animated = false, imageUrl }: { product: Product; className?: string; animated?: boolean; imageUrl?: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const photo = imageUrl || product.imageUrls?.[0] || product.imageUrl;
  if (photo && failedUrl !== photo) {
    return <img src={photo} alt={product.name} loading="lazy" onError={() => setFailedUrl(photo)} className={`object-contain ${className}`} />;
  }
  return <WatchArt style={product.style} caseColor={product.caseColor} dialColor={product.dialColor} accent={product.accent} animated={animated} className={className} />;
}
