import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

const baseUrl = siteConfig.url.replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep account, admin and backend endpoints out of crawling.
        // Public utility pages use noindex metadata instead of disallow so
        // crawlers can see and honor their robots directives.
        disallow: ["/admin/", "/api/", "/auth/", "/favorites", "/profile", "/settings"],
      },
    ],
    sitemap: `${baseUrl}/sitemap-index.xml`,
  };
}
