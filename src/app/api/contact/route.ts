import { NextRequest, NextResponse } from "next/server";
import { submitContactMessage } from "@/features/contact/services/contact";

const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

function getClientKey(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  );
}

export async function POST(req: NextRequest) {
  const now = Date.now();
  const key = getClientKey(req);
  const current = requestCounts.get(key);

  if (!current || current.resetAt <= now) {
    requestCounts.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
  } else if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return NextResponse.json(
      { error: "تم تجاوز الحد المسموح. حاول مرة أخرى لاحقاً." },
      { status: 429, headers: { "Retry-After": "600" } },
    );
  } else {
    current.count += 1;
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
