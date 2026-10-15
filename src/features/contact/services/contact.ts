import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import { isValidContactEmail } from "@/features/contact/validation";

export type ContactMessageInput = {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
};

export type ContactResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitContactMessage(
  input: unknown,
): Promise<ContactResult> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "صيغة الطلب غير صالحة." };
  }

  const fields = input as ContactMessageInput;
  const name = typeof fields.name === "string" ? fields.name.trim() : "";
  const email =
    typeof fields.email === "string" ? fields.email.trim().toLowerCase() : "";
  const subject =
    typeof fields.subject === "string" ? fields.subject.trim() : "";
  const message =
    typeof fields.message === "string" ? fields.message.trim() : "";

  if (!name || !email || !message) {
    return { ok: false, error: "الاسم والبريد والرسالة مطلوبة." };
  }

  if (!isValidContactEmail(email)) {
    return { ok: false, error: "البريد الإلكتروني غير صالح." };
  }

  if (name.length > 120 || message.length > 5000 || subject.length > 200) {
    return { ok: false, error: "البيانات المدخلة طويلة جداً." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("contacts").insert({
    name,
    email,
    subject: subject || "بدون موضوع",
    message,
    language: "ar",
    read: false,
    notification_sent: false,
  });

  if (error) {
    console.error("[contact] insert failed:", error);
    return { ok: false, error: "خطأ داخلي في الخادم." };
  }

  return { ok: true };
}
