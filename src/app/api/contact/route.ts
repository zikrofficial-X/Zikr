import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

function getClientKey(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(req: NextRequest) {
  const now = Date.now();
  const key = getClientKey(req);
  const current = requestCounts.get(key);
  if (!current || current.resetAt <= now) {
    requestCounts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return NextResponse.json(
      { error: "تم تجاوز الحد المسموح. حاول مرة أخرى لاحقاً." },
      { status: 429, headers: { "Retry-After": "600" } }
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
        { status: 400 }
      );
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "صيغة الطلب غير صالحة." },
        { status: 400 }
      );
    }
    const fields = body as Record<string, unknown>;
    const name = typeof fields.name === "string" ? fields.name : "";
    const email = typeof fields.email === "string" ? fields.email : "";
    const subject = typeof fields.subject === "string" ? fields.subject : "";
    const message = typeof fields.message === "string" ? fields.message : "";

    if (!name.trim() || !email.trim() || !message.trim()) {
      return NextResponse.json(
        { error: "الاسم والبريد والرسالة مطلوبة." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.trim().length > 254) {
      return NextResponse.json(
        { error: "البريد الإلكتروني غير صالح." },
        { status: 400 }
      );
    }
    if (
      name.trim().length > 120 ||
      message.trim().length > 5000 ||
      (subject?.trim().length ?? 0) > 200
    ) {
      return NextResponse.json(
        { error: "البيانات المدخلة طويلة جداً." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.from("contacts").insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject?.trim() || "بدون موضوع",
      message: message.trim(),
      language: "ar",
      read: false,
      notification_sent: false,
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact API]", err);
    return NextResponse.json(
      { error: "خطأ داخلي في الخادم." },
      { status: 500 }
    );
  }
}
