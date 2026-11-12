export function getServiceWorkerScriptUrl(input: {
  isNative: boolean;
  hostname: string;
  productionUrl: string;
}): string {
  if (input.isNative) return "/sw.js?native=1";

  try {
    const productionUrl = new URL(input.productionUrl);
    const hostname = input.hostname.trim().toLowerCase().replace(/\.$/, "");
    if (productionUrl.protocol === "https:" && hostname === productionUrl.hostname.toLowerCase()) {
      return "/sw.js?monetag=1";
    }
  } catch {
    // Unknown or invalid origins must use the ad-free worker.
  }

  return "/sw.js";
}
