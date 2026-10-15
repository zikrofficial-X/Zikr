import { NextRequest, NextResponse } from "next/server";
import { submitContactMessage } from "@/features/contact/services/contact";
import { consumePublicContactRateLimit } from "@/features/contact/services/rate-limit";

function getClientIdentifier(request: NextRequest) {
  return (
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  try {
    const allowed = await consumePublicContactRateLimit(getClientIdentifier(req));
    if (!allowed) {
      return NextResponse.json(
        { error: "تم تجاوز الحد المسموح. حاول مرة أخرى لاحقاً." },
        { status: 429, headers: { "Retry-After": "600" } },
      );
    }
  } catch (error) {
    console.error(
      "[contact rate limit] unavailable",
      error instanceof Error ? error.message : "unknown",
    );
    return NextResponse.json(
      { error: "الخدمة غير متاحة مؤقتًا. حاول مرة أخرى لاحقًا." },
      { status: 503, headers: { "Retry-After": "60" } },
    );
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "صيغة JSON غير صالحة." },
        { status: 400 },
      );
    }

    const result = await submitContactMessage(body);
    if (!result.ok) {
      const status =
        result.error === "صيغة الطلب غير صالحة." ||
        result.error === "الاسم والبريد والرسالة مطلوبة." ||
        result.error === "البريد الإلكتروني غير صالح." ||
        result.error === "البيانات المدخلة طويلة جداً."
          ? 400
          : 500;

      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[contact API]", error);
    return NextResponse.json(
      { error: "خطأ داخلي في الخادم." },
      { status: 500 },
    );
  }
}
