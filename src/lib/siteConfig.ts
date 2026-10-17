const address = (import.meta.env.VITE_STORE_ADDRESS as string | undefined)?.trim() || "Ns Illam, Langrcan Rd, R.S. Puram, Coimbatore, Tamil Nadu 641002";

export const siteConfig = {
  mapUrl: `https://maps.google.com/?q=${encodeURIComponent(address)}`,
  address,
  phone: (import.meta.env.VITE_STORE_PHONE as string | undefined)?.trim() || "6369772594",
  email: (import.meta.env.VITE_STORE_EMAIL as string | undefined)?.trim() || "grandhour01@gmail.com",
  hours: (import.meta.env.VITE_STORE_HOURS as string | undefined)?.trim() || null,
};
