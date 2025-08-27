import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/dashboard"],
        disallow: ["/api/"],
      },
    ],
    sitemap: undefined,
  };
}


