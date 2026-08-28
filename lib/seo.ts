/**
 * SEO Optimization Utilities
 */

export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
  author?: string;
  publishedDate?: string;
  modifiedDate?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

/**
 * Generate structured data for JSON-LD
 */
export function generateStructuredData(
  type: string,
  data: Record<string, unknown>
) {
  return {
    "@context": "https://schema.org",
    "@type": type,
    ...data,
  };
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbs(
  items: Array<{ name: string; url: string }>
) {
  return generateStructuredData("BreadcrumbList", {
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  });
}

/**
 * Generate article structured data
 */
export function generateArticleSchema(data: {
  headline: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author: string;
  url: string;
}) {
  return generateStructuredData("Article", {
    headline: data.headline,
    description: data.description,
    image: data.image,
    datePublished: data.datePublished,
    dateModified: data.dateModified || data.datePublished,
    author: {
      "@type": "Person",
      name: data.author,
    },
    url: data.url,
  });
}

/**
 * Generate organization structured data
 */
export function generateOrganizationSchema(data: {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
}) {
  return generateStructuredData("Organization", {
    name: data.name,
    url: data.url,
    logo: data.logo,
    description: data.description,
    sameAs: data.sameAs || [],
  });
}

/**
 * Generate FAQ structured data
 */
export function generateFAQSchema(
  items: Array<{ question: string; answer: string }>
) {
  return generateStructuredData("FAQPage", {
    mainEntity: items.map(item => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  });
}

/**
 * Optimize text for SEO
 */
export function optimizeTextForSEO(
  text: string,
  maxLength: number = 160
): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

/**
 * Generate slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Check if text contains target keywords
 */
export function checkKeywordDensity(text: string, keyword: string): number {
  const words = text.toLowerCase().split(/\s+/);
  const keywordCount = words.filter(w => w === keyword.toLowerCase()).length;
  return (keywordCount / words.length) * 100;
}

/**
 * Generate meta description
 */
export function generateMetaDescription(text: string): string {
  return optimizeTextForSEO(text, 160);
}

/**
 * Generate meta keywords
 */
export function generateMetaKeywords(keywords: string[]): string {
  return keywords.slice(0, 10).join(", ");
}

/**
 * Check page SEO score (simple heuristic)
 */
export function calculateSEOScore(data: {
  title?: string;
  description?: string;
  keywords?: string[];
  hasH1?: boolean;
  hasStructuredData?: boolean;
  hasAltText?: boolean;
  hasMetaRobots?: boolean;
}): number {
  let score = 0;

  if (data.title && data.title.length > 30 && data.title.length < 60)
    score += 20;
  if (
    data.description &&
    data.description.length > 120 &&
    data.description.length < 160
  )
    score += 20;
  if (data.keywords && data.keywords.length > 0) score += 15;
  if (data.hasH1) score += 15;
  if (data.hasStructuredData) score += 15;
  if (data.hasAltText) score += 10;
  if (data.hasMetaRobots) score += 5;

  return Math.min(score, 100);
}
