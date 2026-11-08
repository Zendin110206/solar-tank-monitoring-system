import { AUTH_CONTENT } from "@/components/auth/auth-content";
import { AuthLayout, AuthNote } from "@/components/auth/auth-layout";
import { isAccessRequestEnabled } from "@/features/auth/server/auth-config";
import { getCurrentSessionUser } from "@/features/auth/server/auth-session";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SignInForm from "./sign-in-form";
import { getSafeLoginRedirectPath } from "@/features/auth/domain/auth-redirect";

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

  const copy = AUTH_CONTENT.signIn;
  // Pengajuan akses mandiri masih dibuka sementara; tautannya mengikuti
  // saklar AUTH_ENABLE_REGISTER yang sama dengan halaman /register.
  const showAccessRequest = isAccessRequestEnabled();

  return (
    <AuthLayout
      description={copy.description}
      heading={copy.heading}
      note={
        <AuthNote
          lines={[
            copy.accessNote,
            showAccessRequest ? copy.accessNoteRequest : copy.accessNoteContact,
          ]}
        />
      }
    >
      <SignInForm
        redirectTo={nextPath}
        showAccessRequest={showAccessRequest}
        verificationReason={params.reason}
        verified={verified}
      />
    </AuthLayout>
  );
}
