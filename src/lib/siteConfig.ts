export const siteConfig = {
  address: import.meta.env.VITE_STORE_ADDRESS || "H.R Complex, Prakasam Bus Stop, Oppanakara Street, Near AB Lodge, Town Hall, Coimbatore, Tamil Nadu 641001, India",
  phone: (import.meta.env.VITE_STORE_PHONE as string | undefined)?.trim() || null,
  email: (import.meta.env.VITE_STORE_EMAIL as string | undefined)?.trim() || null,
  hours: (import.meta.env.VITE_STORE_HOURS as string | undefined)?.trim() || null,
};
