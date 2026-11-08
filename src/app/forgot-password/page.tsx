import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import { AUTH_CONTENT } from "@/components/auth/auth-content";
import { AuthLayout, AuthNote } from "@/components/auth/auth-layout";
import { AuthTextLink, AuthTextLinks } from "@/components/auth/auth-text-link";
import ForgotPasswordForm from "./forgot-password-form";

const copy = AUTH_CONTENT.forgotPassword;

export const metadata: Metadata = {
  title: "Atur Ulang Kata Sandi | FTM",
  description:
    "Permintaan atur ulang kata sandi akun FTM melalui email terdaftar.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      description={copy.description}
      heading={copy.heading}
      note={<AuthNote lines={[copy.note]} />}
    >
      <ForgotPasswordForm />
      <AuthTextLinks>
        <AuthTextLink href="/login" icon={ArrowLeft}>
          {AUTH_CONTENT.backToSignIn}
        </AuthTextLink>
      </AuthTextLinks>
    </AuthLayout>
  );
}
