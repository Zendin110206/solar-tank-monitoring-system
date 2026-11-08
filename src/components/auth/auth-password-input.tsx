"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

import { AUTH_CONTENT } from "./auth-content";
import {
  AUTH_FIELD_ICON_CLASS,
  AUTH_HINT_CLASS,
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
} from "./auth-form-classes";

type AuthPasswordInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className" | "id" | "type"
> & {
  hint?: string;
  id: string;
  label: string;
};

// Input kata sandi dengan ikon gembok dan tombol tampil/sembunyi.
export function AuthPasswordInput({
  "aria-describedby": describedBy,
  disabled,
  hint,
  id,
  label,
  ...inputProps
}: AuthPasswordInputProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const ariaDescribedBy =
    [hintId, describedBy].filter(Boolean).join(" ") || undefined;
  const [visible, setVisible] = useState(false);
  const toggleLabel = `${
    visible
      ? AUTH_CONTENT.password.hidePrefix
      : AUTH_CONTENT.password.showPrefix
  } ${label.toLowerCase()}`;

  return (
    <div>
      <label className={AUTH_LABEL_CLASS} htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <LockKeyhole aria-hidden="true" className={AUTH_FIELD_ICON_CLASS} />
        <input
          {...inputProps}
          aria-describedby={ariaDescribedBy}
          className={`${AUTH_INPUT_CLASS} pr-[calc(64*var(--auth-u))]`}
          disabled={disabled}
          id={id}
          type={visible ? "text" : "password"}
        />
        <button
          aria-label={toggleLabel}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 grid w-[max(44px,calc(62*var(--auth-u)))] place-items-center rounded-r-[calc(8*var(--auth-u))] text-zinc-500 transition hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-red"
          disabled={disabled}
          onClick={() => setVisible((current) => !current)}
          type="button"
        >
          {visible ? (
            <EyeOff
              aria-hidden="true"
              className="size-[calc(22*var(--auth-u))]"
            />
          ) : (
            <Eye aria-hidden="true" className="size-[calc(22*var(--auth-u))]" />
          )}
        </button>
      </div>
      {hint ? (
        <p className={AUTH_HINT_CLASS} id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
