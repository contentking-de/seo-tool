export const runtime = "nodejs";
import ky from "ky";
import * as cheerio from "cheerio";
import { z } from "zod";
import { rateLimit } from "@/middleware/rateLimit";

function isValidHttpUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");
  const ip = (request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1").trim();
  if (!rateLimit(ip)) {
    return new Response("Too Many Requests", { status: 429 });
  }
  if (!targetUrl || !isValidHttpUrl(targetUrl)) {
    return new Response(JSON.stringify({ error: "Invalid or missing url" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const html = await ky.get(targetUrl, {
      headers: {
        "user-agent": "seo-toolbot/1.0 (+https://example.com)"
      },
      timeout: 15000,
      retry: { limit: 1 },
    }).text();

    const $ = cheerio.load(html);
    const title = $("title").first().text().trim();
    const metaDescription = $('meta[name="description"]').attr("content")?.trim() ?? null;
    const h1 = $("h1").first().text().trim() || null;
    const robotsMeta = $('meta[name="robots"]').attr("content")?.trim() ?? null;
    const canonical = $('link[rel="canonical"]').attr("href") ?? null;
    const ogTitle = $('meta[property="og:title"]').attr("content") ?? null;
    const ogDescription = $('meta[property="og:description"]').attr("content") ?? null;
    const ogUrl = $('meta[property="og:url"]').attr("content") ?? null;
    const lang = $("html").attr("lang") ?? null;

    const pageUrl = new URL(targetUrl);
    const linksAll = $("a[href]")
      .map((_, el) => String($(el).attr("href") || "").trim())
      .get()
      .filter(Boolean)
      .filter((href) => !href.startsWith("mailto:") && !href.startsWith("tel:") && !href.startsWith("javascript:") && href !== "#" && !href.startsWith("#"));

    const toAbs = (href: string) => {
      try {
        return new URL(href, pageUrl).toString();
      } catch {
        return null;
      }
    };

    const linksAbs = linksAll.map(toAbs).filter((u): u is string => Boolean(u));
    const internal = linksAbs.filter((u) => {
      try {
        return new URL(u).host === pageUrl.host;
      } catch {
        return false;
      }
    });
    const external = linksAbs.filter((u) => {
      try {
        return new URL(u).host !== pageUrl.host;
      } catch {
        return false;
      }
    });
    const nofollow = $("a[rel~='nofollow']").length;

    const checks = {
      title: { value: title || null, ok: Boolean(title) },
      metaDescription: { value: metaDescription, ok: Boolean(metaDescription) },
      h1: { value: h1, ok: Boolean(h1) },
      robots: { value: robotsMeta, ok: !(robotsMeta?.includes("noindex")) },
      canonical: { value: canonical, ok: Boolean(canonical) },
      og: {
        title: { value: ogTitle, ok: Boolean(ogTitle) },
        description: { value: ogDescription, ok: Boolean(ogDescription) },
        url: { value: ogUrl, ok: Boolean(ogUrl) },
      },
      htmlLang: { value: lang, ok: Boolean(lang) },
      counts: {
        images: $("img").length,
        links: linksAbs.length,
        h1s: $("h1").length,
      },
      links: {
        internal: internal.length,
        external: external.length,
        nofollow,
      },
    } as const;

    // Optional: Google PageSpeed Insights (Lighthouse) summary
    type PageSpeedSummary = {
      strategy: string;
      performance: number | null;
      metrics: {
        fcpMs: number | null;
        lcpMs: number | null;
        cls: number | null;
        tbtMs: number | null;
        siMs: number | null;
      };
    } | null;
    let pagespeed: PageSpeedSummary = null;
    try {
      const psiKey = process.env.PAGESPEED_API_KEY;
      const base = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
      const qs = new URLSearchParams({
        url: targetUrl,
        strategy: "mobile",
        category: "PERFORMANCE",
      });
      if (psiKey) qs.set("key", psiKey);
      const psiRespUnknown: unknown = await ky
        .get(`${base}?${qs.toString()}`, { timeout: 20000, retry: { limit: 0 } })
        .json();

      const LhSchema = z.object({
        lighthouseResult: z
          .object({
            categories: z
              .object({
                performance: z.object({ score: z.number().nullable().optional() }).partial().optional(),
              })
              .partial()
              .optional(),
            audits: z
              .record(z.string(), z.object({ numericValue: z.number().nullable().optional() }))
              .optional(),
          })
          .optional(),
      });

      const parsed = LhSchema.safeParse(psiRespUnknown);
      const lr = parsed.success ? parsed.data.lighthouseResult : undefined;
      if (lr) {
        const n = (k: string) => lr.audits?.[k]?.numericValue ?? null;
        pagespeed = {
          strategy: "mobile",
          performance: lr.categories?.performance?.score ?? null,
          metrics: {
            fcpMs: n("first-contentful-paint"),
            lcpMs: n("largest-contentful-paint"),
            cls: n("cumulative-layout-shift"),
            tbtMs: n("total-blocking-time"),
            siMs: n("speed-index"),
          },
        };
      }
    } catch {
      pagespeed = null; // Do not block audit if PSI fails
    }

    return new Response(JSON.stringify({ url: targetUrl, checks, pagespeed }), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Fetch or parse failed" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}


