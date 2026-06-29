import AuthShell from "@/components/auth/auth-shell";
import type { Metadata } from "next";
import Link from "next/link";
import SignInForm from "./sign-in-form";

export const metadata: Metadata = {
  title: "Masuk | SolarTank",
  description:
    "Masuk ke dashboard SolarTank untuk memantau volume tangki, runtime genset, dan kondisi perangkat.",
};

export default function LoginPage() {
  return (
    <AuthShell
      description="Halaman ini menyiapkan tampilan masuk untuk operator monitoring. Integrasi autentikasi dan sesi pengguna akan disambungkan pada tahap berikutnya."
      footerPrompt={
        <>
          Belum memiliki akses?{" "}
          <Link
            className="font-semibold text-blue-600 transition hover:text-blue-700"
            href="/register"
          >
            Ajukan akses
          </Link>
          .
        </>
      }
      heading="Masuk ke SolarTank"
    >
      <SignInForm />
    </AuthShell>
  );
}
