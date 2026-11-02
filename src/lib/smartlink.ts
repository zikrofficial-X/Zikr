/**
 * Monetag SmartLink placement for clearly disclosed external advertising.
 * Keep this link out of child-directed content and sacred-text reading flows.
 */
export const MONETAG_SMARTLINK_URL = "https://uplcm.com/4/12171895";

export const MONETAG_SMARTLINK_DISCLOSURE_AR =
  "رابط إعلاني خارجي — قد يفتح عروضًا أو صفحات لدى جهات أخرى:";

export const MONETAG_SMARTLINK_DISCLOSURE_EN =
  "External advertising link — may open offers or pages from third parties:";

export const MONETAG_SMARTLINK_YOUTUBE_TAGS = [
  "smartlink",
  "external offers",
  "روابط إعلانية",
] as const;

export function appendSmartLinkDisclosure(
  description: string,
  isEligible: boolean,
): string {
  const base = description.trim();
  if (!isEligible || base.includes(MONETAG_SMARTLINK_URL)) return base;

  const disclosure = `${MONETAG_SMARTLINK_DISCLOSURE_AR}\n${MONETAG_SMARTLINK_URL}`;
  return [base, disclosure].filter(Boolean).join("\n\n");
}
