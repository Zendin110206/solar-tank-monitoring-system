import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import { AUTH_CONTENT } from "@/components/auth/auth-content";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthTextLink, AuthTextLinks } from "@/components/auth/auth-text-link";
import ResetPasswordForm from "./reset-password-form";

const copy = AUTH_CONTENT.resetPassword;

export const metadata: Metadata = {
  title: "Buat Kata Sandi Baru | FTM",
  description: "Buat kata sandi baru dari tautan atur ulang akun FTM.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const token = (await searchParams).token ?? "";

  return (
    <AuthLayout description={copy.description} heading={copy.heading}>
      <ResetPasswordForm token={token} />
      <AuthTextLinks>
        <AuthTextLink href="/login" icon={ArrowLeft}>
          {AUTH_CONTENT.backToSignIn}
        </AuthTextLink>
      </AuthTextLinks>
    </AuthLayout>
  );
}
