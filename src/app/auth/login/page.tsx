import { LoginPage } from "@/features/auth/components/login-page";
import { PRODUCTION_URL } from "@/lib/site";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: LoginPageProps) {
  const requestHeaders = await headers();
  const forwardedHost =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "";
  const requestHost = forwardedHost.split(",")[0].trim().split(":")[0].toLowerCase();
  const canonicalHost = new URL(PRODUCTION_URL).hostname.toLowerCase();

  if (requestHost.endsWith(".vercel.app") && requestHost !== canonicalHost) {
    const canonicalLogin = new URL("/auth/login", PRODUCTION_URL);
    const params = searchParams ? await searchParams : {};
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string") canonicalLogin.searchParams.set(key, value);
      else if (Array.isArray(value)) {
        for (const item of value) canonicalLogin.searchParams.append(key, item);
      }
    }
    redirect(canonicalLogin.toString());
  }

  return <LoginPage />;
}
