"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { ArrowRight, Mail } from "lucide-react";

import { TurnstileWidget } from "@/features/auth/components/turnstile-widget";

export default function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setPending(true);
    setMessage(null);
    setError(null);

    const formData = new FormData(form);

    try {
      const response = await fetch("/api/auth/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identity: formData.get("identity"),
          captchaToken: formData.get("captchaToken"),
        }),
      });
      const result = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; data?: { message?: string } }
        | null;

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error ?? "Permintaan reset gagal.");
      }

      setMessage(
        result.data?.message ??
          "Jika akun ditemukan, link reset akan dikirim ke email terdaftar.",
      );
      form.reset();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Permintaan reset belum bisa diproses.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-7 space-y-4" noValidate onSubmit={handleSubmit}>
      <div>
        <label
          className="mb-2 block text-sm font-semibold text-zinc-800"
          htmlFor="identity"
        >
          Email atau nama pengguna
        </label>
        <div className="relative">
          <Mail
            aria-hidden="true"
            className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
          />
          <input
            autoComplete="username"
            autoFocus
            className="h-12 w-full rounded-lg border border-zinc-300 bg-white pl-11 pr-4 text-[0.95rem] text-zinc-950 outline-none transition placeholder:text-zinc-400 hover:border-zinc-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
            id="identity"
            inputMode="email"
            name="identity"
            placeholder="nama@perusahaan.co.id"
            required
            type="text"
          />
        </div>
      </div>

      <TurnstileWidget />

      {message ? (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">
          {error}
        </div>
      ) : null}

      <button
        className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/20 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={pending}
        type="submit"
      >
        {pending ? "Mengirim..." : "Kirim link reset"}
        <ArrowRight
          aria-hidden="true"
          className="size-4 transition group-hover:translate-x-0.5"
        />
      </button>
    </form>
  );
}
