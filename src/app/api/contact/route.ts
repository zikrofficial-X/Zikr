import { NextRequest, NextResponse } from "next/server";
import { submitContactMessage } from "@/features/contact/services/contact";
import { consumePublicContactRateLimit } from "@/features/contact/services/rate-limit";
import { getTrustedClientAddress } from "@/lib/request/client-address";
import { readBoundedJsonBody } from "@/lib/request/bounded-json-body";

export async function POST(req: NextRequest) {
  try {
    const allowed = await consumePublicContactRateLimit(
      getTrustedClientAddress(
        req.headers.get("x-real-ip"),
        req.headers.get("x-forwarded-for"),
      ),
    );
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
    const parsedBody = await readBoundedJsonBody(req, 8 * 1024);
    if (!parsedBody.ok) {
      return NextResponse.json(
        { error: parsedBody.error },
        { status: parsedBody.status, headers: { "Cache-Control": "no-store" } },
      );
    }

    const result = await submitContactMessage(parsedBody.value);
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
