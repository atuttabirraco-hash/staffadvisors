import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { SITE_URL: base, companySlug } = await import("@/lib/site");
        const { publicClient } = await import("@/lib/public.functions");
        const { data } = await publicClient().from("companies").select("id, name, city, province, created_at").limit(45000);
        const urls = ["/", "/app", "/aziende", "/lavoro", "/bacheca-disponibilita", "/pubblica-offerta", "/registrati-azienda", "/inserisci-disponibilita", "/contatti", "/privacy", "/termini", "/cookie"].map((p) => `<url><loc>${base}${p}</loc></url>`);
        for (const c of data ?? []) {
          urls.push(`<url><loc>${base}/azienda/${companySlug(c)}</loc><lastmod>${c.created_at.slice(0, 10)}</lastmod></url>`);
        }
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`;
        return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
      },
    },
  },
});
