import AuthShell from "@/components/auth/auth-shell";
import type { Metadata } from "next";
import SignInForm from "./sign-in-form";

export const metadata: Metadata = {
  title: "Masuk | SolarTank",
  description:
    "Masuk ke dashboard SolarTank untuk memantau volume tangki, runtime genset, dan kondisi perangkat.",
};

const DEVELOPMENT_TURNSTILE_SITE_KEY = "1x00000000000000000000AA";

export default function LoginPage() {
  const configuredSiteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  const siteKey =
    configuredSiteKey ||
    (process.env.NODE_ENV === "production"
      ? ""
      : DEVELOPMENT_TURNSTILE_SITE_KEY);

  return (
    <AuthShell
      description="Masuk dengan akun yang diberikan administrator untuk melanjutkan ke dashboard monitoring tangki."
      footerPrompt="Belum memiliki akses? Hubungi administrator sistem SolarTank."
      heading="Selamat datang kembali"
    >
      <SignInForm siteKey={siteKey} />
    </AuthShell>
  );
}
