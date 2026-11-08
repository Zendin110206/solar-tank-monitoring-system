import type { Metadata } from "next";
import { LogIn } from "lucide-react";
import { redirect } from "next/navigation";

import { AUTH_CONTENT } from "@/components/auth/auth-content";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthTextLink, AuthTextLinks } from "@/components/auth/auth-text-link";
import { getCurrentSessionUser } from "@/features/auth/server/auth-session";
import SignUpForm from "./sign-up-form";

const copy = AUTH_CONTENT.register;

export const metadata: Metadata = {
  title: "Ajukan Akses | FTM",
  description:
    "Pengajuan akses FTM untuk petugas operasional; akun aktif setelah disetujui administrator.",
};

export default async function RegisterPage() {
  const user = await getCurrentSessionUser().catch(() => null);

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthLayout description={copy.description} heading={copy.heading} wide>
      <SignUpForm />
      <AuthTextLinks>
        <AuthTextLink href="/login" icon={LogIn}>
          {copy.haveAccount}
        </AuthTextLink>
      </AuthTextLinks>
    </AuthLayout>
  );
}
