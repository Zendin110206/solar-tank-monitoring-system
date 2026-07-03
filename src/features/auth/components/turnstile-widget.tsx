"use client";

import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

export function TurnstileWidget({
  inputId = "captchaToken",
  inputName = "captchaToken",
}: {
  inputId?: string;
  inputName?: string;
}) {
  const siteKey = process.env.NEXT_PUBLIC_AUTH_CAPTCHA_SITE_KEY?.trim();

  if (!siteKey) {
    return <input id={inputId} name={inputName} type="hidden" defaultValue="" />;
  }

  return (
    <div className="space-y-2">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => {
          const host = document.getElementById(`${inputId}-host`);
          const input = document.getElementById(inputId) as HTMLInputElement;

          if (!host || !input || host.dataset.rendered === "true") {
            return;
          }

          window.turnstile?.render(host, {
            sitekey: siteKey,
            callback: (token) => {
              input.value = token;
            },
            "expired-callback": () => {
              input.value = "";
            },
            "error-callback": () => {
              input.value = "";
            },
          });
          host.dataset.rendered = "true";
        }}
      />
      <input id={inputId} name={inputName} type="hidden" defaultValue="" />
      <div id={`${inputId}-host`} />
    </div>
  );
}
