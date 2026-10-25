import type { HTMLAttributes } from "react";

// Kartu putih standar: tepi abu-abu tipis, sudut membulat, bayangan lembut.
// Kelas tambahan (misalnya animate-soft-fade atau mt-5) ditaruh di depan kelas dasar.
export const CARD_CLASS =
  "rounded-lg border border-zinc-200 bg-white p-5 shadow-sm";

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: "article" | "div" | "section";
};

export function Card({
  as: Element = "section",
  className,
  ...props
}: CardProps) {
  return (
    <Element
      className={className ? `${className} ${CARD_CLASS}` : CARD_CLASS}
      {...props}
    />
  );
}
