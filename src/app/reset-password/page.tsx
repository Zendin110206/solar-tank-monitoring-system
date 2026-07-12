import AuthShell from "@/components/auth/auth-shell";
import type { Metadata } from "next";
import Link from "next/link";
import ResetPasswordForm from "./reset-password-form";

export const metadata: Metadata = {
  title: "Buat Password Baru | FTM",
  description: "Buat kata sandi baru dari link reset akun FTM.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const token = (await searchParams).token ?? "";

  return (
    <AuthShell
      description="Buat kata sandi baru. Setelah berhasil, semua sesi lama akan dicabut dan Anda perlu masuk ulang."
      footerPrompt={
        <>
          Kembali ke{" "}
          <Link
            className="font-semibold text-blue-600 transition hover:text-blue-700"
            href="/login"
          >
            halaman masuk
          </Link>
          .
        </>
      }
      heading="Buat password baru"
    >
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
