export const runtime = "nodejs";
import ky from "ky";
import * as cheerio from "cheerio";
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
        links: $("a").length,
        h1s: $("h1").length,
      },
    } as const;

    return new Response(JSON.stringify({ url: targetUrl, checks }), {
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


