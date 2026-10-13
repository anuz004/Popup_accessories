export type WatchStyle = "classic" | "sport" | "smart" | "diamond" | "minimal";

export interface Product {
  id: string;
  name: string;
  line: string;
  category: "Classic" | "Sport" | "Luxury" | "Smart" | "Limited Edition";
  gender: "Men" | "Women" | "Unisex";
  price: number;
  originalPrice?: number | null;
  rating: number;
  reviews: number;
  badge?: "New" | "Bestseller" | "Limited" | "-15%" | null;
  style: WatchStyle;
  caseColor: string;
  dialColor: string;
  accent: string;
  movement: "Automatic" | "Quartz" | "Smart OS";
  waterResistance: string;
  dial: string;
  caseMaterial: string;
  strapMaterial: string;
  caseSize: string;
  description: string;
  short: string;
  imageUrl?: string | null;
  imageUrls?: string[];
  active?: boolean;
  createdAt?: string;
}

export interface Offer {
  id: string;
  title: string;
  code?: string | null;
  discountType: "percent" | "flat";
  discountValue: number;
  scope: "all" | "category" | "product";
  target?: string | null;
  active: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

// Keeps the storefront useful in development and during a backend outage. The
// catalogue is replaced by live Supabase rows as soon as they are available.
export const fallbackProducts: Product[] = [
  {
    id: "demo-aurum-meridian", name: "Aurum Meridian", line: "Aurum", category: "Luxury", gender: "Unisex",
    price: 8499, originalPrice: 9999, rating: 4.8, reviews: 126, badge: "Bestseller", style: "diamond",
    caseColor: "#D4AF37", dialColor: "#101012", accent: "#F4D675", movement: "Quartz", waterResistance: "50m",
    dial: "Sunray black", caseMaterial: "Stainless steel", strapMaterial: "Stainless steel", caseSize: "40mm",
    short: "A gold-tone statement watch with a deep sunray dial.",
    description: "A polished gold-tone case, precise quartz movement and refined markers make the Aurum Meridian an effortless occasion piece.", active: true,
  },
  {
    id: "demo-meridian-diver", name: "Meridian Diver", line: "Meridian", category: "Sport", gender: "Men",
    price: 6299, originalPrice: 7499, rating: 4.7, reviews: 89, badge: "New", style: "sport",
    caseColor: "#9CA3AF", dialColor: "#07131D", accent: "#38BDF8", movement: "Quartz", waterResistance: "100m",
    dial: "Luminous navy", caseMaterial: "Stainless steel", strapMaterial: "Silicone", caseSize: "44mm",
    short: "A rugged everyday diver with luminous detailing.",
    description: "Built for active days with a grippy silicone strap, luminous hands and 100-metre water resistance.", active: true,
  },
  {
    id: "demo-celeste-pearl", name: "Celeste Pearl", line: "Celeste", category: "Luxury", gender: "Women",
    price: 7199, originalPrice: 8499, rating: 4.9, reviews: 74, badge: "Limited", style: "diamond",
    caseColor: "#E7C6B5", dialColor: "#FFF8F0", accent: "#D4AF37", movement: "Quartz", waterResistance: "30m",
    dial: "Mother-of-pearl", caseMaterial: "Stainless steel", strapMaterial: "Mesh steel", caseSize: "32mm",
    short: "A luminous pearl dial framed in warm rose gold.",
    description: "The Celeste Pearl pairs a light-catching dial with a slim mesh bracelet for an elegant, jewellery-inspired finish.", active: true,
  },
  {
    id: "demo-obsidian-noir", name: "Obsidian Noir", line: "Obsidian", category: "Limited Edition", gender: "Unisex",
    price: 10999, rating: 4.8, reviews: 51, badge: "Limited", style: "minimal",
    caseColor: "#25262A", dialColor: "#050506", accent: "#D4AF37", movement: "Automatic", waterResistance: "50m",
    dial: "Matte black", caseMaterial: "PVD stainless steel", strapMaterial: "Italian leather", caseSize: "41mm",
    short: "A numbered all-black automatic with restrained gold accents.",
    description: "A small-batch automatic defined by its matte black profile, exhibition case back and minimal gold detailing.", active: true,
  },
  {
    id: "demo-heritage-ivory", name: "Heritage Ivory", line: "Heritage", category: "Classic", gender: "Unisex",
    price: 4599, rating: 4.6, reviews: 143, style: "classic",
    caseColor: "#C9CDD2", dialColor: "#F8F2E7", accent: "#8B6B3E", movement: "Quartz", waterResistance: "30m",
    dial: "Ivory", caseMaterial: "Stainless steel", strapMaterial: "Brown leather", caseSize: "38mm",
    short: "A clean ivory dial paired with supple brown leather.",
    description: "Traditional proportions and an easy-to-read ivory dial make this a dependable watch for every day.", active: true,
  },
  {
    id: "demo-pulse-one", name: "Pulse One", line: "Pulse", category: "Smart", gender: "Unisex",
    price: 5499, originalPrice: 6499, rating: 4.5, reviews: 201, badge: "New", style: "smart",
    caseColor: "#2D3035", dialColor: "#08090B", accent: "#22D3EE", movement: "Smart OS", waterResistance: "50m",
    dial: "AMOLED touch", caseMaterial: "Aluminium", strapMaterial: "Fluoroelastomer", caseSize: "42mm",
    short: "An AMOLED smartwatch for health, calls and daily movement.",
    description: "Crisp notifications, activity tracking and a comfortable all-day strap in a focused, understated design.", active: true,
  },
];

export const collections = [
  {
    key: "Luxury",
    title: "Luxury Watches",
    copy: "Gold tones and statement dials for special occasions.",
    style: "diamond" as WatchStyle,
    caseColor: "#D4AF37",
    dialColor: "#0F0F10",
  },
  {
    key: "Sport",
    title: "Sport Watches",
    copy: "Chronographs and divers built for an active life.",
    style: "sport" as WatchStyle,
    caseColor: "#8a8d92",
    dialColor: "#101114",
  },
  {
    key: "Classic",
    title: "Classic Watches",
    copy: "Slim, everyday silhouettes that never go out of style.",
    style: "classic" as WatchStyle,
    caseColor: "#c0c2c6",
    dialColor: "#FAF7F0",
  },
  {
    key: "Smart",
    title: "Smart Watches",
    copy: "Modern features behind a clean, minimal display.",
    style: "smart" as WatchStyle,
    caseColor: "#2b2c30",
    dialColor: "#0b0b0d",
  },
  {
    key: "Limited Edition",
    title: "Limited Edition",
    copy: "Numbered pieces, released in small batches.",
    style: "diamond" as WatchStyle,
    caseColor: "#161618",
    dialColor: "#000000",
  },
];

export const testimonials = [
  {
    name: "Ananya R.",
    role: "Verified Buyer",
    quote:
      "The Aurum Meridian arrived exactly as pictured — heavier, warmer, better finished than I expected for the price.",
    rating: 5,
  },
  {
    name: "Devraj K.",
    role: "Verified Buyer",
    quote:
      "Ordered the Meridian Diver for a trip and it's outperformed watches twice the price. Packaging alone felt like an event.",
    rating: 5,
  },
  {
    name: "Meera S.",
    role: "Verified Buyer",
    quote:
      "Celeste Pearl is the first watch I've owned that gets complimented more than my jewelry. Delivery from Grand Hour was fast and tracked closely.",
    rating: 5,
  },
  {
    name: "Arjun V.",
    role: "Verified Buyer",
    quote:
      "Cash on delivery made this an easy first online purchase from the store. The Obsidian Noir was worth the wait.",
    rating: 4,
  },
];
