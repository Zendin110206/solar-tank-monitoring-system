"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { ArrowRight, Mail } from "lucide-react";

import { AUTH_CONTENT } from "@/components/auth/auth-content";
import {
  AUTH_FIELD_ICON_CLASS,
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_SUBMIT_SIZE_CLASS,
} from "@/components/auth/auth-form-classes";
import { AuthError, AuthNotice } from "@/components/auth/auth-notice";
import { BRAND_BLOCK_BUTTON_CLASS } from "@/components/ui/button-class";
import { TurnstileWidget } from "@/features/auth/components/turnstile-widget";
import {
  captchaRequiredMessage,
  isCaptchaEnabled,
} from "@/features/auth/components/captcha-settings";

const copy = AUTH_CONTENT.forgotPassword;
const ERROR_ID = "forgot-password-error";

export default function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [captchaRenderKey, setCaptchaRenderKey] = useState(0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setMessage(null);
    setError(null);

    const formData = new FormData(form);
    const captchaToken = String(formData.get("captchaToken") ?? "").trim();

    if (isCaptchaEnabled && !captchaToken) {
      setError(captchaRequiredMessage);
      return;
    }

    setPending(true);

    try {
      const response = await fetch("/api/auth/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identity: formData.get("identity"),
          captchaToken,
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        data?: { message?: string };
      } | null;

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error ?? copy.requestFailed);
      }

      setMessage(result.data?.message ?? copy.requestAccepted);
      form.reset();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : copy.requestFailedFallback,
      );
    } finally {
      if (isCaptchaEnabled) {
        setCaptchaRenderKey((currentKey) => currentKey + 1);
      }
      setPending(false);
    }
  }

  return (
    <form
      className="mt-[calc(32*var(--auth-u))]"
      noValidate
      onSubmit={handleSubmit}
    >
      <label className={AUTH_LABEL_CLASS} htmlFor="identity">
        {copy.identityLabel}
      </label>
      <div className="relative">
        <Mail aria-hidden="true" className={AUTH_FIELD_ICON_CLASS} />
        <input
          aria-describedby={error ? ERROR_ID : undefined}
          aria-invalid={error ? true : undefined}
          autoComplete="username"
          autoFocus
          className={AUTH_INPUT_CLASS}
          id="identity"
          inputMode="email"
          name="identity"
          placeholder={copy.identityPlaceholder}
          required
          type="text"
        />
      </div>

      <div className="mt-[calc(20*var(--auth-u))] empty:hidden">
        <TurnstileWidget key={captchaRenderKey} />
      </div>

      <AuthNotice>{message}</AuthNotice>
      {error ? <AuthError id={ERROR_ID}>{error}</AuthError> : null}

      <button
        className={`${BRAND_BLOCK_BUTTON_CLASS} ${AUTH_SUBMIT_SIZE_CLASS} mt-[calc(25*var(--auth-u))]`}
        disabled={pending}
        type="submit"
      >
        {pending ? copy.sending : copy.submit}
        <ArrowRight
          aria-hidden="true"
          className="size-[calc(22*var(--auth-u))] transition group-hover:translate-x-0.5"
        />
      </button>
    </form>
  );
}
