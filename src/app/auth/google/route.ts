import type { NextRequest } from "next/server";
import { handleGoogleOAuth } from "@/features/auth/integrations/google-oauth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return handleGoogleOAuth(request);
}
