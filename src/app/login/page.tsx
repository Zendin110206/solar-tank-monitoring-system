import AuthShell from "@/components/auth/auth-shell";
import { getCurrentSessionUser } from "@/features/auth/lib/auth-session";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import SignInForm from "./sign-in-form";
import { getSafeLoginRedirectPath } from "@/features/auth/lib/auth-redirect";

type LoginSearchParams = {
  verified?: string;
  reason?: string;
  next?: string;
  identity?: string;
  password?: string;
  otp?: string;
};

export const metadata: Metadata = {
  title: "Masuk | FTM",
  description:
    "Masuk ke dashboard FTM untuk memantau volume tangki, runtime genset, dan kondisi perangkat.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<LoginSearchParams>;
}) {
  const params = await searchParams;
  const nextPath = getSafeLoginRedirectPath(params.next);

  if (params.identity || params.password || params.otp) {
    const cleanParams = new URLSearchParams();

    if (params.next) {
      cleanParams.set("next", nextPath);
    }

    if (params.verified === "1" || params.verified === "0") {
      cleanParams.set("verified", params.verified);
    }

    if (params.reason) {
      cleanParams.set("reason", params.reason);
    }

    redirect(`/login${cleanParams.size ? `?${cleanParams.toString()}` : ""}`);
  }

  const user = await getCurrentSessionUser().catch(() => null);

  if (user) {
    redirect(nextPath);
  }

  const verified =
    params.verified === "1" ? "1" : params.verified === "0" ? "0" : undefined;

  return (
    <AuthShell
      description="Masuk dengan akun yang sudah disetujui administrator untuk membuka dashboard FTM sesuai peran akses."
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
      heading="Masuk ke FTM"
    >
      <SignInForm
        redirectTo={nextPath}
        verificationReason={params.reason}
        verified={verified}
      />
    </AuthShell>
  );
}
