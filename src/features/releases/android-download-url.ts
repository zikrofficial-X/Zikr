const APK_DOWNLOAD_PATH = "/api/download/android";

export function resolveAndroidApkDownloadUrl(
  value: string,
  currentOrigin: string,
): string {
  const origin = new URL(currentOrigin);
  const isLocalHttp =
    origin.protocol === "http:" &&
    (origin.hostname === "localhost" || origin.hostname === "127.0.0.1");

  if (origin.protocol !== "https:" && !isLocalHttp) {
    throw new Error("The app origin must use HTTPS.");
  }

  const target = new URL(value, origin);

  if (target.origin !== origin.origin) {
    throw new Error("The Android APK download must stay on the app origin.");
  }

  if (target.pathname !== APK_DOWNLOAD_PATH) {
    throw new Error("Unexpected Android APK download path.");
  }

  if (target.username || target.password || target.hash) {
    throw new Error("Unexpected Android APK URL components.");
  }

  return target.toString();
}
