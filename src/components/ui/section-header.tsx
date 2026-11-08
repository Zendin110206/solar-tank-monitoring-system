// Judul bagian halaman: label kecil merah, judul, dan penjelasan singkat.
// `limitDescriptionWidth` membatasi lebar penjelasan agar baris tidak terlalu panjang.
export function SectionHeader({
  description,
  label,
  limitDescriptionWidth = false,
  title,
}: {
  description: string;
  label: string;
  limitDescriptionWidth?: boolean;
  title: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-600">
        {label}
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-normal text-zinc-950">
        {title}
      </h2>
      <p
        className={
          limitDescriptionWidth
            ? "mt-2 max-w-3xl text-sm leading-6 text-zinc-500"
            : "mt-2 text-sm leading-6 text-zinc-500"
        }
      >
        {description}
      </p>
    </div>
  );
}
