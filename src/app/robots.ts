import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

const baseUrl = siteConfig.url.replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep private/admin/backend endpoints out of crawling.
        // Public noindex pages must remain crawlable so search engines can
        // fetch and honor their noindex metadata instead of reporting them
        // as blocked by robots.txt.
        disallow: ["/admin", "/api", "/auth"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
