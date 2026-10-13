export const siteConfig = {
  mapUrl: "https://maps.google.com/?q=11.003716,76.951859",
  mapCoordinates: "11.003716,76.951859",
  address: import.meta.env.VITE_STORE_ADDRESS || "H.R Complex, Prakasam Bus Stop, Oppanakara Street, Near AB Lodge, Town Hall, Coimbatore, Tamil Nadu 641001, India",
  phone: (import.meta.env.VITE_STORE_PHONE as string | undefined)?.trim() || "6369772594",
  email: (import.meta.env.VITE_STORE_EMAIL as string | undefined)?.trim() || "grandhour01@gmail.com",
  hours: (import.meta.env.VITE_STORE_HOURS as string | undefined)?.trim() || null,
};
