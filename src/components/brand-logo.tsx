import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  priority?: boolean;
  showText?: boolean;
  text?: string;
  textClassName?: string;
};

function joinClasses(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function BrandLogo({
  className,
  markClassName,
  priority = false,
  showText = true,
  text = "FTM",
  textClassName,
}: BrandLogoProps) {
  return (
    <span className={joinClasses("flex min-w-0 items-center gap-3", className)}>
      <Image
        alt=""
        aria-hidden="true"
        className={joinClasses("size-9 shrink-0 object-contain", markClassName)}
        height={192}
        priority={priority}
        src="/logo/android-icon-192x192.png"
        width={192}
      />
      {showText ? (
        <span
          className={joinClasses(
            "truncate text-lg font-semibold tracking-normal",
            textClassName,
          )}
        >
          {text}
        </span>
      ) : null}
    </span>
  );
}
