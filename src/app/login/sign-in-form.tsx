"use client";

import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, Mail, UserPlus } from "lucide-react";
import { AUTH_CONTENT } from "@/components/auth/auth-content";
import {
  AUTH_FIELD_ICON_CLASS,
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_SUBMIT_SIZE_CLASS,
} from "@/components/auth/auth-form-classes";
import { AuthError, AuthNotice } from "@/components/auth/auth-notice";
import { AuthPasswordInput } from "@/components/auth/auth-password-input";
import { AuthTextLink, AuthTextLinks } from "@/components/auth/auth-text-link";
import { BRAND_BLOCK_BUTTON_CLASS } from "@/components/ui/button-class";

const copy = AUTH_CONTENT.signIn;
const ERROR_ID = "sign-in-error";

export default function SignInForm({
  redirectTo = "/dashboard",
  showAccessRequest = false,
  verificationReason,
  verified,
}: {
  redirectTo?: string;
  showAccessRequest?: boolean;
  verificationReason?: string;
  verified?: "0" | "1";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [routePending, startRouteTransition] = useTransition();
  const busy = pending || navigating || routePending;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setNavigating(false);
    setError(null);
    setMessage(null);
    let shouldResetPending = true;

    const formData = new FormData(event.currentTarget);
    const body = challengeId
      ? {
          challengeId,
          code: String(formData.get("otp") ?? ""),
        }
      : {
          identity: String(formData.get("identity") ?? ""),
          password: String(formData.get("password") ?? ""),
        };

    try {
      const response = await fetch(
        challengeId ? "/api/auth/login/verify-otp" : "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );
      const result = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        data?: {
          requiresOtp?: boolean;
          challengeId?: string;
          delivery?: "email" | "log";
          redirectTo?: string;
        };
      } | null;

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error ?? copy.loginFailed);
      }

      if (result.data?.requiresOtp && result.data.challengeId) {
        setChallengeId(result.data.challengeId);
        setMessage(
          result.data.delivery === "log"
            ? copy.otpSentToLog
            : copy.otpSentToEmail,
        );
        return;
      }

      const nextPath = redirectTo || result.data?.redirectTo || "/dashboard";

      setMessage(copy.loginSucceeded);
      setNavigating(true);
      shouldResetPending = false;
      // Halaman tujuan baru diminta setelah sesi aktif. Halaman ini sengaja
      // tidak memuat tujuan lebih awal: muatan yang diambil sebelum masuk
      // berisi pengalihan ke /login dan membuat layar kosong setelah masuk.
      startRouteTransition(() => {
        router.replace(nextPath);
        router.refresh();
      });
    } catch (caughtError) {
      setNavigating(false);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : copy.loginFailedFallback,
      );
    } finally {
      if (shouldResetPending) {
        setPending(false);
      }
    }
  }

  const notice = error
    ? null
    : message
      ? { tone: "info" as const, text: message }
      : verified === "1"
        ? { tone: "success" as const, text: copy.emailVerified }
        : verified === "0"
          ? {
              tone: "warning" as const,
              text: verificationReason || copy.emailNotVerified,
            }
          : null;
  const fieldErrorProps = error
    ? { "aria-describedby": ERROR_ID, "aria-invalid": true as const }
    : {};

  return (
    <form
      className="mt-[calc(32*var(--auth-u))]"
      method="post"
      noValidate
      onSubmit={handleSubmit}
    >
      {challengeId ? (
        <div>
          <label className={AUTH_LABEL_CLASS} htmlFor="otp">
            {copy.otpLabel}
          </label>
          <div className="relative">
            <LockKeyhole aria-hidden="true" className={AUTH_FIELD_ICON_CLASS} />
            <input
              {...fieldErrorProps}
              autoComplete="one-time-code"
              autoFocus
              className={`${AUTH_INPUT_CLASS} text-center font-semibold tracking-[0.3em]`}
              disabled={busy}
              id="otp"
              inputMode="numeric"
              maxLength={6}
              name="otp"
              pattern="[0-9]{6}"
              placeholder={copy.otpPlaceholder}
              required
              type="text"
            />
          </div>
        </div>
      ) : (
        <>
          <div>
            <label className={AUTH_LABEL_CLASS} htmlFor="identity">
              {copy.identityLabel}
            </label>
            <div className="relative">
              <Mail aria-hidden="true" className={AUTH_FIELD_ICON_CLASS} />
              <input
                {...fieldErrorProps}
                autoComplete="username"
                autoFocus
                className={AUTH_INPUT_CLASS}
                disabled={busy}
                id="identity"
                inputMode="email"
                name="identity"
                placeholder={copy.identityPlaceholder}
                required
                type="text"
              />
            </div>
          </div>

          <div className="mt-[calc(15*var(--auth-u))]">
            <AuthPasswordInput
              {...fieldErrorProps}
              autoComplete="current-password"
              disabled={busy}
              id="password"
              label={copy.passwordLabel}
              name="password"
              placeholder={copy.passwordPlaceholder}
              required
            />
          </div>
        </>
      )}

      <AuthNotice tone={notice?.tone}>{notice?.text}</AuthNotice>
      {error ? <AuthError id={ERROR_ID}>{error}</AuthError> : null}

      <button
        className={`${BRAND_BLOCK_BUTTON_CLASS} ${AUTH_SUBMIT_SIZE_CLASS} mt-[calc(25*var(--auth-u))]`}
        disabled={busy}
        type="submit"
      >
        {navigating || routePending
          ? copy.openingDashboard
          : pending
            ? copy.processing
            : challengeId
              ? copy.submitOtp
              : copy.submit}
        <ArrowRight
          aria-hidden="true"
          className="size-[calc(22*var(--auth-u))] transition group-hover:translate-x-0.5"
        />
      </button>

      {challengeId ? null : (
        <AuthTextLinks>
          <AuthTextLink href="/forgot-password" icon={LockKeyhole}>
            {copy.forgotPassword}
          </AuthTextLink>
          {showAccessRequest ? (
            <AuthTextLink href="/register" icon={UserPlus}>
              {copy.requestAccess}
            </AuthTextLink>
          ) : null}
        </AuthTextLinks>
      )}
    </form>
  );
}
