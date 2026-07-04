import AuthShell from "@/components/auth/auth-shell";
import type { Metadata } from "next";
import Link from "next/link";
import SignUpForm from "./sign-up-form";

export const metadata: Metadata = {
  title: "Ajukan Akses | SolarTank",
  description:
    "Tampilan pengajuan akses SolarTank untuk operator monitoring dan reviewer operasional.",
};

export default function RegisterPage() {
  return (
    <AuthShell
      contentWidth="wide"
      contextNote={{
        title: "Pengajuan akses",
        description:
          "Akun baru masuk sebagai pengajuan dan harus disetujui administrator sebelum bisa membuka dashboard.",
      }}
      description="Lengkapi identitas kerja untuk mengajukan akses sistem monitoring tangki."
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
      heading="Ajukan akses pengguna"
    >
      <SignUpForm />
    </AuthShell>
  );
}
