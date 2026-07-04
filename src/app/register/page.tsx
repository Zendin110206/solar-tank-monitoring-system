import AuthShell from "@/components/auth/auth-shell";
import { getCurrentSessionUser } from "@/features/auth/lib/auth-session";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import SignUpForm from "./sign-up-form";

export const metadata: Metadata = {
  title: "Ajukan Akses | SolarTank",
  description:
    "Tampilan pengajuan akses SolarTank untuk operator monitoring dan reviewer operasional.",
};

export default async function RegisterPage() {
  const user = await getCurrentSessionUser().catch(() => null);

  if (user) {
    redirect("/dashboard");
  }

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
