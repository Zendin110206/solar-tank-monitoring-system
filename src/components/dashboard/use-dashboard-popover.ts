"use client";

import { usePathname } from "next/navigation";
import { type RefObject, useEffect, useRef, useState } from "react";

// Perilaku bersama panel tarik-turun di header (notifikasi, akun):
// klik di luar panel atau pindah halaman menutupnya, dan Escape menutupnya
// lalu mengembalikan fokus ke tombol pembuka.
export function useDashboardPopover(): {
  close: () => void;
  isOpen: boolean;
  rootRef: RefObject<HTMLDivElement | null>;
  toggle: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
} {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus({ preventScroll: true });
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return {
    close: () => setIsOpen(false),
    isOpen,
    rootRef,
    toggle: () => setIsOpen((current) => !current),
    triggerRef,
  };
}
