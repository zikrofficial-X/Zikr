import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
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
    const { name, email, subject, message } = body as Record<string, string>;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
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
