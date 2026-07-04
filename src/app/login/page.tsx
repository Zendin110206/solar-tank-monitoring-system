import AuthShell from "@/components/auth/auth-shell";
import { getCurrentSessionUser } from "@/features/auth/lib/auth-session";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import SignInForm from "./sign-in-form";

export const metadata: Metadata = {
  title: "Masuk | SolarTank",
  description:
    "Masuk ke dashboard SolarTank untuk memantau volume tangki, runtime genset, dan kondisi perangkat.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string; reason?: string; next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = getSafeLoginRedirectPath(params.next);
  const user = await getCurrentSessionUser().catch(() => null);

  if (user) {
    redirect(nextPath);
  }

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
        redirectTo={nextPath}
        verificationReason={params.reason}
        verified={verified}
      />
    </AuthShell>
  );
}

function getSafeLoginRedirectPath(value: string | undefined): string {
  if (!value) {
    return "/dashboard";
  }

  try {
    const parsed = new URL(value, "https://solar-tank.local");

    if (
      parsed.origin !== "https://solar-tank.local" ||
      !isDashboardPath(parsed.pathname)
    ) {
      return "/dashboard";
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/dashboard";
  }
}

function isDashboardPath(pathname: string): boolean {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}
