"use client";

import Script from "next/script";
import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  submitLogin,
} from "./actions";
import { initialLoginFormState } from "./form-state";

type TurnstileOptions = {
  sitekey: string;
  theme: "light";
  size: "flexible";
  action: string;
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
};

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: TurnstileOptions,
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type SignInFormProps = {
  siteKey: string;
};

function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden ? (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.3A10.5 10.5 0 0 1 12 4c5.3 0 8.7 4.5 9.6 6a1.8 1.8 0 0 1 0 2c-.4.7-1.5 2.2-3.1 3.5M6.2 6.2C4.2 7.5 2.9 9.3 2.4 10a1.8 1.8 0 0 0 0 2c.9 1.5 4.3 6 9.6 6 1 0 2-.2 2.8-.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  ) : (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M2.4 10a1.8 1.8 0 0 0 0 2c.9 1.5 4.3 6 9.6 6s8.7-4.5 9.6-6a1.8 1.8 0 0 0 0-2C20.7 8.5 17.3 4 12 4S3.3 8.5 2.4 10Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle
        cx="12"
        cy="11"
        r="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <rect
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
        width="14"
        x="5"
        y="10"
      />
      <path
        d="M8 10V7a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export default function SignInForm({ siteKey }: SignInFormProps) {
  const [state, formAction, isPending] = useActionState(
    submitLogin,
    initialLoginFormState,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaMessage, setCaptchaMessage] = useState(
    siteKey ? "Memuat verifikasi keamanan…" : "CAPTCHA belum dikonfigurasi.",
  );
  const captchaContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const renderTurnstile = useCallback(() => {
    if (
      !siteKey ||
      !captchaContainerRef.current ||
      !window.turnstile ||
      widgetIdRef.current
    ) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(
      captchaContainerRef.current,
      {
        sitekey: siteKey,
        theme: "light",
        size: "flexible",
        action: "login",
        callback: (token) => {
          setCaptchaToken(token);
          setCaptchaMessage("Verifikasi keamanan berhasil.");
        },
        "expired-callback": () => {
          setCaptchaToken("");
          setCaptchaMessage("Verifikasi berakhir. Silakan ulangi.");
        },
        "error-callback": () => {
          setCaptchaToken("");
          setCaptchaMessage("Verifikasi gagal dimuat. Silakan coba kembali.");
        },
      },
    );
  }, [siteKey]);

  useEffect(() => {
    renderTurnstile();

    return () => {
      const widgetId = widgetIdRef.current;

      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId);
        widgetIdRef.current = null;
      }
    };
  }, [renderTurnstile]);

  useEffect(() => {
    if (state.submissionId === 0) {
      return;
    }

    const widgetId = widgetIdRef.current;

    if (widgetId && window.turnstile) {
      window.turnstile.reset(widgetId);
      setCaptchaToken("");
      setCaptchaMessage("Selesaikan kembali verifikasi keamanan.");
    }
  }, [state.submissionId]);

  return (
    <>
      {siteKey ? (
        <Script
          id="cloudflare-turnstile"
          onError={() =>
            setCaptchaMessage(
              "Layanan verifikasi gagal dimuat. Periksa koneksi Anda.",
            )
          }
          onReady={renderTurnstile}
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
        />
      ) : null}

      <form action={formAction} className="mt-7 space-y-4" noValidate>
        {/* Identity field */}
        <div>
          <label
            className="mb-2 block text-sm font-semibold text-zinc-800"
            htmlFor="identity"
          >
            Email atau nama pengguna
          </label>
          <input
            autoComplete="username"
            autoFocus
            className="h-12 w-full rounded-lg border border-zinc-300 bg-white px-4 text-[0.95rem] text-zinc-950 outline-none transition placeholder:text-zinc-400 hover:border-zinc-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
            id="identity"
            inputMode="email"
            name="identity"
            placeholder="nama@perusahaan.co.id"
            required
            type="text"
          />
        </div>

        {/* Password field */}
        <div>
          <div className="mb-2 flex items-center justify-between gap-4">
            <label
              className="text-sm font-semibold text-zinc-800"
              htmlFor="password"
            >
              Kata sandi
            </label>
            <span className="text-xs text-zinc-500">
              Lupa akses? Hubungi administrator
            </span>
          </div>
          <div className="relative">
            <input
              autoComplete="current-password"
              className="h-12 w-full rounded-lg border border-zinc-300 bg-white px-4 pr-12 text-[0.95rem] text-zinc-950 outline-none transition placeholder:text-zinc-400 hover:border-zinc-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
              id="password"
              name="password"
              placeholder="Masukkan kata sandi"
              required
              type={showPassword ? "text" : "password"}
            />
            <button
              aria-label={
                showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
              }
              className="absolute inset-y-0 right-0 grid w-12 place-items-center text-zinc-400 transition hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"
              onClick={() => setShowPassword((visible) => !visible)}
              type="button"
            >
              <EyeIcon hidden={showPassword} />
            </button>
          </div>
        </div>

        {/* Session preference */}
        <label className="flex w-fit cursor-pointer items-center gap-3 text-sm text-zinc-600">
          <input
            className="size-4 rounded border-zinc-300 accent-blue-600"
            name="remember"
            type="checkbox"
          />
          Ingat perangkat ini
        </label>

        {/* CAPTCHA */}
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3.5">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-zinc-600">
            <LockIcon />
            Verifikasi keamanan
          </div>
          <div
            className="min-h-[65px] w-full overflow-hidden"
            ref={captchaContainerRef}
          />
          <p
            aria-live="polite"
            className={`mt-2 text-xs ${
              captchaToken ? "text-emerald-700" : "text-zinc-500"
            }`}
          >
            {captchaMessage}
          </p>
        </div>

        {/* Form feedback */}
        {state.status !== "idle" ? (
          <div
            aria-live="polite"
            className={`rounded-lg border px-4 py-3 text-sm leading-6 ${
              state.status === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-blue-200 bg-blue-50 text-blue-800"
            }`}
            role="status"
          >
            {state.message}
          </div>
        ) : null}

        <button
          className="flex h-12 w-full items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/25 disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-blue-400"
          disabled={isPending || !siteKey}
          type="submit"
        >
          {isPending ? "Memverifikasi…" : "Masuk ke dashboard"}
        </button>
      </form>
    </>
  );
}
