import type { Metadata } from "next";
import { ForgotPasswordPage } from "@/features/auth/components/forgot-password-page";

export const metadata: Metadata = {
  title: "استعادة كلمة المرور | ذِكر",
  description: "استعادة الوصول إلى حسابك في منصة ذِكر.",
};

export default function Page() {
  return <ForgotPasswordPage />;
}
