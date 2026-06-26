import AuthShell from "@/components/auth/auth-shell";
import type { Metadata } from "next";
import Link from "next/link";
import SignUpForm from "./sign-up-form";

export const metadata: Metadata = {
  title: "Daftar Pengguna | SolarTank",
  description:
    "Daftarkan akun pengguna SolarTank dengan identitas perusahaan dan lokasi kerja STO.",
};

export default function RegisterPage() {
  return (
    <AuthShell
      contentWidth="wide"
      contextNote={{
        title: "Akun pengguna",
        description:
          "Pendaftaran ini khusus pengguna. Akun admin disiapkan terpisah oleh sistem.",
      }}
      description="Lengkapi identitas perusahaan untuk mengajukan akses ke dashboard monitoring tangki."
      footerPrompt={
        <>
          Sudah memiliki akun?{" "}
          <Link
            className="font-semibold text-blue-600 transition hover:text-blue-700"
            href="/login"
          >
            Masuk di sini
          </Link>
          .
        </>
      }
      heading="Buat akun pengguna"
    >
      <SignUpForm />
    </AuthShell>
  );
}
