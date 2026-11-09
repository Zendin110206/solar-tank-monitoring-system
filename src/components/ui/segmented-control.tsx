"use client";

import type { ReactNode } from "react";

export type SegmentedControlOption<T extends string> = {
  icon?: ReactNode;
  label: string;
  value: T;
};

type SegmentedControlProps<T extends string> = {
  className?: string;
  label: string;
  onChange: (value: T) => void;
  options: readonly SegmentedControlOption<T>[];
  value: T;
};

// Tombol pilihan berderet (gaya tab TailAdmin): latar abu-abu muda, pilihan
// aktif ditandai pil biru yang bergeser halus ke pilihan baru. Setiap tombol
// sama lebar dan cukup lebar untuk labelnya.
export function SegmentedControl<T extends string>({
  className = "",
  label,
  onChange,
  options,
  value,
}: SegmentedControlProps<T>) {
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  return (
    <div
      aria-label={label}
      className={`relative grid h-11 min-w-0 rounded-lg bg-zinc-100 p-1 ${className}`}
      role="group"
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-1 left-1 rounded-md bg-blue-600 shadow-sm shadow-blue-600/25 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{
          transform: `translateX(${activeIndex * 100}%)`,
          width: `calc((100% - 0.5rem) / ${options.length})`,
        }}
      />
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            aria-pressed={isActive}
            className={`relative z-10 inline-flex h-full min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40 ${
              isActive ? "text-white" : "text-zinc-500 hover:text-zinc-900"
            }`}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
