// Token-based surface — calls the API cross-origin (no cookies). In prod set
// VITE_API_URL to the lastlink-web URL at build time.
export function getApiUrl(): string {
  return import.meta.env.VITE_API_URL ?? "http://localhost:10000";
}

/** Public marketing homepage (the logo links back to it). */
export function getMarketingUrl(): string {
  return import.meta.env.VITE_MARKETING_URL ?? "https://lastlink-marketing.onrender.com";
}
