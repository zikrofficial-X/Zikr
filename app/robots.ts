import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

const baseUrl = siteConfig.url.replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private / admin / API routes must not be indexed
        disallow: ["/admin/", "/api/", "/auth/", "/favorites", "/profile", "/settings", "/wird", "/memorization"],
      },
    ],
    sitemap: `${baseUrl}/sitemap-index.xml`,
  };
}
