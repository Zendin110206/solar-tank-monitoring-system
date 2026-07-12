import AuthShell from "@/components/auth/auth-shell";
import type { Metadata } from "next";
import Link from "next/link";
import ForgotPasswordForm from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Lupa Password | FTM",
  description:
    "Permintaan reset kata sandi akun FTM melalui email terdaftar.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      description="Masukkan email atau nama pengguna. Jika akun ditemukan, link reset akan dikirim ke email terdaftar."
      footerPrompt={
        <>
          Sudah ingat akses?{" "}
          <Link
            className="font-semibold text-blue-600 transition hover:text-blue-700"
            href="/login"
          >
            Masuk kembali
          </Link>
          .
        </>
      }
      heading="Reset kata sandi"
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
