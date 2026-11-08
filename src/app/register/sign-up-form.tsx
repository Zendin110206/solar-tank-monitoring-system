"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";

import { AUTH_CONTENT } from "@/components/auth/auth-content";
import {
  AUTH_FIELD_ICON_CLASS,
  AUTH_HINT_CLASS,
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_PLAIN_INPUT_CLASS,
  AUTH_SUBMIT_SIZE_CLASS,
} from "@/components/auth/auth-form-classes";
import { AuthError, AuthNotice } from "@/components/auth/auth-notice";
import { AuthPasswordInput } from "@/components/auth/auth-password-input";
import { BRAND_BLOCK_BUTTON_CLASS } from "@/components/ui/button-class";
import { SelectField } from "@/components/ui/select-field";
import { TurnstileWidget } from "@/features/auth/components/turnstile-widget";
import {
  captchaRequiredMessage,
  isCaptchaEnabled,
} from "@/features/auth/components/captcha-settings";

const copy = AUTH_CONTENT.register;
const ERROR_ID = "register-error";
const FIELD_HEIGHT_CLASS = "h-[max(44px,calc(58*var(--auth-u)))]";
const GRID_CLASS =
  "grid gap-[calc(18*var(--auth-u))] sm:grid-cols-2 [&>*]:min-w-0";

function buildAccessReason(formData: FormData): string {
  const position = String(formData.get("position") ?? "").trim();
  const note = String(formData.get("accessReason") ?? "").trim();

  return [`Peran kerja: ${position || "-"}`, note].filter(Boolean).join("\n\n");
}

export default function SignUpForm() {
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaRenderKey, setCaptchaRenderKey] = useState(0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    setSubmitted(false);

    const formData = new FormData(form);
    const captchaToken = String(formData.get("captchaToken") ?? "").trim();

    if (isCaptchaEnabled && !captchaToken) {
      setError(captchaRequiredMessage);
      return;
    }

    setPending(true);

    try {
      const response = await fetch("/api/auth/register-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.get("fullName"),
          username: formData.get("username"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          requestedRole: "user",
          password: formData.get("password"),
          confirmPassword: formData.get("confirmPassword"),
          accessReason: buildAccessReason(formData),
          captchaToken,
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error ?? copy.failed);
      }

      setSubmitted(true);
      form.reset();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : copy.failed,
      );
    } finally {
      if (isCaptchaEnabled) {
        setCaptchaRenderKey((currentKey) => currentKey + 1);
      }
      setPending(false);
    }
  }

  const errorProps = error ? { "aria-describedby": ERROR_ID } : {};

  return (
    <form
      className="mt-[calc(32*var(--auth-u))] space-y-[calc(18*var(--auth-u))]"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className={GRID_CLASS}>
        <div>
          <label className={AUTH_LABEL_CLASS} htmlFor="fullName">
            {copy.fullNameLabel}
          </label>
          <div className="relative">
            <UserRound aria-hidden="true" className={AUTH_FIELD_ICON_CLASS} />
            <input
              {...errorProps}
              autoComplete="name"
              autoFocus
              className={AUTH_INPUT_CLASS}
              id="fullName"
              name="fullName"
              placeholder={copy.fullNamePlaceholder}
              required
              type="text"
            />
          </div>
        </div>
        <div>
          <label className={AUTH_LABEL_CLASS} htmlFor="username">
            {copy.usernameLabel}
          </label>
          <input
            {...errorProps}
            autoComplete="username"
            className={`${AUTH_PLAIN_INPUT_CLASS} ${FIELD_HEIGHT_CLASS}`}
            id="username"
            name="username"
            placeholder={copy.usernamePlaceholder}
            required
            type="text"
          />
        </div>
      </div>

      <div>
        <label className={AUTH_LABEL_CLASS} htmlFor="email">
          {copy.emailLabel}
        </label>
        <div className="relative">
          <Mail aria-hidden="true" className={AUTH_FIELD_ICON_CLASS} />
          <input
            aria-describedby={error ? `email-hint ${ERROR_ID}` : "email-hint"}
            autoComplete="email"
            className={AUTH_INPUT_CLASS}
            id="email"
            inputMode="email"
            name="email"
            placeholder={copy.emailPlaceholder}
            required
            type="email"
          />
        </div>
        <p className={AUTH_HINT_CLASS} id="email-hint">
          {copy.emailHint}
        </p>
      </div>

      <div className={GRID_CLASS}>
        <div>
          <label className={AUTH_LABEL_CLASS} htmlFor="phone">
            {copy.phoneLabel}
          </label>
          <div className="relative">
            <Phone aria-hidden="true" className={AUTH_FIELD_ICON_CLASS} />
            <input
              aria-describedby={error ? `phone-hint ${ERROR_ID}` : "phone-hint"}
              autoComplete="tel"
              className={AUTH_INPUT_CLASS}
              id="phone"
              inputMode="tel"
              pattern="(?:[+]?62|0|8)[0-9 .()-]{7,16}"
              name="phone"
              placeholder={copy.phonePlaceholder}
              required
              title={copy.phoneTitle}
              type="tel"
            />
          </div>
          <p className={AUTH_HINT_CLASS} id="phone-hint">
            {copy.phoneHint}
          </p>
        </div>
        <div>
          <label className={AUTH_LABEL_CLASS} htmlFor="position">
            {copy.positionLabel}
          </label>
          <SelectField
            {...errorProps}
            className={AUTH_INPUT_CLASS}
            defaultValue=""
            id="position"
            leadingIcon={
              <BriefcaseBusiness
                aria-hidden="true"
                className={AUTH_FIELD_ICON_CLASS}
              />
            }
            name="position"
            required
          >
            <option disabled value="">
              {copy.positionPlaceholder}
            </option>
            {copy.positions.map((position) => (
              <option key={position}>{position}</option>
            ))}
          </SelectField>
        </div>
      </div>

      <div className={GRID_CLASS}>
        <AuthPasswordInput
          {...errorProps}
          autoComplete="new-password"
          hint={copy.passwordHint}
          id="password"
          label={copy.passwordLabel}
          name="password"
          placeholder={copy.passwordPlaceholder}
          required
        />
        <AuthPasswordInput
          {...errorProps}
          autoComplete="new-password"
          id="confirmPassword"
          label={copy.confirmLabel}
          name="confirmPassword"
          placeholder={copy.confirmPlaceholder}
          required
        />
      </div>

      <div>
        <label className={AUTH_LABEL_CLASS} htmlFor="accessReason">
          {copy.reasonLabel}
        </label>
        <textarea
          className={`${AUTH_PLAIN_INPUT_CLASS} min-h-[calc(110*var(--auth-u))] py-[calc(14*var(--auth-u))]`}
          id="accessReason"
          name="accessReason"
          placeholder={copy.reasonPlaceholder}
        />
      </div>

      <div className="empty:hidden">
        <TurnstileWidget key={captchaRenderKey} />
      </div>

      <AuthNotice>{submitted ? copy.submitted : null}</AuthNotice>
      {error ? <AuthError id={ERROR_ID}>{error}</AuthError> : null}

      <button
        className={`${BRAND_BLOCK_BUTTON_CLASS} ${AUTH_SUBMIT_SIZE_CLASS} !mt-[calc(25*var(--auth-u))]`}
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
