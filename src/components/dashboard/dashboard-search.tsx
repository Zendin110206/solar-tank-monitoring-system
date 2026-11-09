"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search } from "lucide-react";
import {
  type FormEvent,
  type KeyboardEvent,
  type Ref,
  useId,
  useMemo,
  useState,
} from "react";

import {
  filterSearchItems,
  type DashboardSearchItem,
} from "./dashboard-navigation";
import { DASHBOARD_SHELL_CONTENT } from "./dashboard-shell-content";

const copy = DASHBOARD_SHELL_CONTENT.search;

type DashboardSearchProps = {
  autoFocus?: boolean;
  inputRef?: Ref<HTMLInputElement>;
  items: readonly DashboardSearchItem[];
  onDone?: () => void;
  shortcutLabel?: string;
};

// Pencarian di header: mencari menu dan halaman dashboard yang boleh dibuka
// oleh peran pengguna, lalu membuka halaman yang dipilih. Panah atas/bawah
// memilih hasil, Enter membuka, Escape menutup.
export function DashboardSearch({
  autoFocus = false,
  inputRef,
  items,
  onDone,
  shortcutLabel,
}: DashboardSearchProps) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const matches = useMemo(
    () => filterSearchItems(items, query),
    [items, query],
  );
  const showResults = isOpen && query.trim().length > 0;
  const activeMatch = matches[Math.min(activeIndex, matches.length - 1)];

  function reset() {
    setQuery("");
    setIsOpen(false);
    setActiveIndex(0);
  }

  function openItem(item: DashboardSearchItem) {
    reset();
    onDone?.();
    router.push(item.href);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (activeMatch) {
      openItem(activeMatch);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();

      if (query) {
        reset();
      } else {
        event.currentTarget.blur();
        onDone?.();
      }

      return;
    }

    if (!showResults || matches.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % matches.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + matches.length) % matches.length);
    }
  }

  return (
    <form
      className="relative w-full"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
      onSubmit={handleSubmit}
      role="search"
    >
      <label className="flex h-11 w-full items-center gap-3 rounded-xl md:h-12 border border-zinc-200 bg-zinc-50/80 px-3.5 text-zinc-500 transition-[border-color,box-shadow,background-color] duration-150 focus-within:border-brand-navy-deep/40 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgb(12_28_55/0.08)] hover:border-zinc-300">
        <span className="sr-only">{copy.label}</span>
        <Search aria-hidden="true" className="size-5 shrink-0" />
        <input
          aria-activedescendant={
            showResults && activeMatch
              ? `${listId}-${activeMatch.id}`
              : undefined
          }
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={showResults}
          autoComplete="off"
          autoFocus={autoFocus}
          className="h-full min-w-0 flex-1 bg-transparent text-[0.95rem] text-brand-ink outline-none placeholder:text-zinc-500 [&::-webkit-search-cancel-button]:hidden"
          enterKeyHint="go"
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={copy.placeholder}
          ref={inputRef}
          role="combobox"
          type="search"
          value={query}
        />
        {shortcutLabel ? (
          <kbd className="hidden shrink-0 rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 font-sans text-[0.7rem] font-medium text-zinc-500 lg:block">
            {shortcutLabel}
          </kbd>
        ) : null}
      </label>

      <div
        aria-label={copy.resultsLabel}
        className={`dashboard-pop absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 max-h-[min(22rem,calc(100dvh-7rem))] overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl shadow-zinc-950/10 ${
          showResults ? "" : "hidden"
        }`}
        id={listId}
        role="listbox"
      >
        {showResults && matches.length > 0
          ? matches.map((item) => {
              const isActive = item.id === activeMatch?.id;

              return (
                <Link
                  aria-selected={isActive}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-100 ${
                    isActive ? "bg-zinc-100" : "hover:bg-zinc-50"
                  }`}
                  href={item.href}
                  id={`${listId}-${item.id}`}
                  key={item.id}
                  onClick={() => {
                    reset();
                    onDone?.();
                  }}
                  onMouseEnter={() => setActiveIndex(matches.indexOf(item))}
                  role="option"
                  tabIndex={-1}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-brand-ink">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-zinc-500">
                      {item.description}
                    </span>
                  </span>
                  {isActive ? (
                    <CornerDownLeft
                      aria-hidden="true"
                      className="size-4 shrink-0 text-zinc-400"
                    />
                  ) : null}
                </Link>
              );
            })
          : null}
        {showResults && matches.length === 0 ? (
          <p className="px-3 py-4 text-center text-sm text-zinc-500">
            {copy.empty}
          </p>
        ) : null}
      </div>
    </form>
  );
}
