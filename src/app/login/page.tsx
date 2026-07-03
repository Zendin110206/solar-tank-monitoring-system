import AuthShell from "@/components/auth/auth-shell";
import type { Metadata } from "next";
import Link from "next/link";
import SignInForm from "./sign-in-form";

export const metadata: Metadata = {
  title: "Masuk | SolarTank",
  description:
    "Masuk ke dashboard SolarTank untuk memantau volume tangki, runtime genset, dan kondisi perangkat.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string; reason?: string }>;
}) {
  const params = await searchParams;
  const verified =
    params.verified === "1" ? "1" : params.verified === "0" ? "0" : undefined;

  return (
    <AuthShell
      description="Masuk dengan akun yang sudah disetujui administrator untuk membuka dashboard monitoring sesuai peran akses."
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
      <SignInForm
        verificationReason={params.reason}
        verified={verified}
      />
    </AuthShell>
  );
}
