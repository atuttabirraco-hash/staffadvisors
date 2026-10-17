// Single source of truth for the public address of the site.
// Used for social preview cards, canonical URLs and share buttons.
export const SITE_URL = "https://staffadvisors.it";

// 1200x630 preview card served from public/ so social networks can fetch it.
export const SOCIAL_IMAGE = `${SITE_URL}/social-card.jpg`;

// SEO-friendly company address: name-city-province-<first 8 chars of id>.
export function companySlug(c: { id: string; name: string; city?: string | null; province?: string | null }) {
  const base = [c.name, c.city, c.province].filter(Boolean).join(" ")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80).replace(/-+$/, "");
  return `${base ? base + "-" : ""}${c.id.slice(0, 8)}`;
}
