"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { DASHBOARD_SHELL_CONTENT } from "./dashboard-shell-content";

const copy = DASHBOARD_SHELL_CONTENT.language;
const NOTE_ID = "dashboard-language-english-note";

// Pilihan bahasa. Bahasa Indonesia aktif; bahasa Inggris tampil tetapi belum
// tersedia: tidak berpindah ke mana pun dan hanya menampilkan keterangan.
export function DashboardLanguageSwitch() {
  const [isNoteShown, setIsNoteShown] = useState(false);

  useEffect(() => {
    if (!isNoteShown) {
      return;
    }

    const timer = window.setTimeout(() => setIsNoteShown(false), 4000);

    return () => window.clearTimeout(timer);
  }, [isNoteShown]);

  return (
    <div
      aria-label={copy.groupLabel}
      className="flex items-center gap-0.5 rounded-full bg-zinc-100 p-1"
      role="group"
    >
      <button
        aria-label={copy.indonesian}
        aria-pressed="true"
        className="relative grid h-9 w-11 place-items-center rounded-full bg-white before:absolute before:inset-x-0 before:-inset-y-1 before:content-[''] shadow-sm ring-1 ring-zinc-200 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy-deep/40"
        title={copy.indonesian}
        type="button"
      >
        <Image
          alt=""
          className="h-3.5 w-5 rounded-[2px] ring-1 ring-black/10 sm:h-4 sm:w-6"
          height={600}
          src="/brand/flags/indonesia.svg"
          width={900}
        />
      </button>

      <div className="group/en relative">
        <button
          aria-describedby={NOTE_ID}
          aria-disabled="true"
          aria-label={copy.englishUnavailable}
          className="relative grid h-9 w-11 cursor-not-allowed before:absolute before:inset-x-0 before:-inset-y-1 before:content-[''] place-items-center rounded-full opacity-55 grayscale-[35%] transition hover:opacity-80 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy-deep/40"
          onClick={() => setIsNoteShown(true)}
          type="button"
        >
          <Image
            alt=""
            className="h-3.5 w-5 rounded-[2px] ring-1 ring-black/10 sm:h-4 sm:w-6"
            height={600}
            src="/brand/flags/united-kingdom.svg"
            width={1000}
          />
        </button>
        <span
          className={`pointer-events-none absolute right-0 top-full z-50 mt-3 w-max max-w-[15rem] rounded-lg bg-brand-navy-deep px-3 py-2 text-xs font-medium leading-5 text-white shadow-lg transition group-hover/en:visible group-hover/en:opacity-100 group-has-[:focus-visible]/en:visible group-has-[:focus-visible]/en:opacity-100 ${
            isNoteShown ? "visible opacity-100" : "invisible opacity-0"
          }`}
          id={NOTE_ID}
          role="tooltip"
        >
          {copy.englishNote}
        </span>
        <span aria-live="polite" className="sr-only">
          {isNoteShown ? copy.englishNote : ""}
        </span>
      </div>
    </div>
  );
}
