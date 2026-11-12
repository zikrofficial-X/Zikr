export function getServiceWorkerScriptUrl(input: {
  isNative: boolean;
  origin: string;
  productionUrl: string;
}): string {
  if (input.isNative) return "/sw.js?native=1";

  try {
    const productionUrl = new URL(input.productionUrl);
    const currentUrl = new URL(input.origin);
    if (productionUrl.protocol === "https:" && currentUrl.origin === productionUrl.origin) {
      return "/sw.js?monetag=1";
    }
  } catch {
    // Unknown or invalid origins must use the ad-free worker.
  }

  return "/sw.js";
}
