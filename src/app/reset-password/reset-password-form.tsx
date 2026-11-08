"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { AUTH_CONTENT } from "@/components/auth/auth-content";
import { AUTH_SUBMIT_SIZE_CLASS } from "@/components/auth/auth-form-classes";
import { AuthError, AuthNotice } from "@/components/auth/auth-notice";
import { AuthPasswordInput } from "@/components/auth/auth-password-input";
import { BRAND_BLOCK_BUTTON_CLASS } from "@/components/ui/button-class";

const copy = AUTH_CONTENT.resetPassword;
const ERROR_ID = "reset-password-error";

export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    token ? null : copy.missingToken,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: formData.get("password"),
          confirmPassword: formData.get("confirmPassword"),
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        data?: { message?: string };
      } | null;

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error ?? copy.resetFailed);
      }

      setMessage(result.data?.message ?? copy.resetSucceeded);
      setTimeout(() => {
        router.replace("/login");
      }, 1200);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : copy.resetFailedFallback,
      );
    } finally {
      setPending(false);
    }
  }

  const fieldErrorProps = error
    ? { "aria-describedby": ERROR_ID, "aria-invalid": true as const }
    : {};

  return (
    <form
      className="mt-[calc(32*var(--auth-u))]"
      noValidate
      onSubmit={handleSubmit}
    >
      <input name="token" type="hidden" value={token} />

      <AuthPasswordInput
        {...fieldErrorProps}
        autoComplete="new-password"
        autoFocus={Boolean(token)}
        hint={copy.passwordHint}
        id="password"
        label={copy.passwordLabel}
        name="password"
        placeholder={copy.placeholder}
        required
      />
      <div className="mt-[calc(15*var(--auth-u))]">
        <AuthPasswordInput
          {...fieldErrorProps}
          autoComplete="new-password"
          id="confirmPassword"
          label={copy.confirmLabel}
          name="confirmPassword"
          placeholder={copy.confirmPlaceholder}
          required
        />
      </div>

      <AuthNotice tone="success">{message}</AuthNotice>
      {error ? <AuthError id={ERROR_ID}>{error}</AuthError> : null}

      <button
        className={`${BRAND_BLOCK_BUTTON_CLASS} ${AUTH_SUBMIT_SIZE_CLASS} mt-[calc(25*var(--auth-u))]`}
        disabled={pending || !token}
        type="submit"
      >
        {pending ? copy.saving : copy.submit}
        <ArrowRight
          aria-hidden="true"
          className="size-[calc(22*var(--auth-u))] transition group-hover:translate-x-0.5"
        />
      </button>
    </form>
  );
}
