import { clamp } from "@/lib/math";

export function TankFallbackVisual({
  fillPercent,
  shape,
}: {
  fillPercent: number;
  shape: "rectangular" | "cylinder";
}) {
  const safeFillPercent = clamp(fillPercent, 0, 100);
  const fillStyle = { height: `${safeFillPercent}%` };
  const surfaceStyle = { bottom: `${safeFillPercent}%` };

  return (
    <div
      className="absolute inset-0 overflow-hidden bg-slate-50"
      aria-label={`Visual tangki fallback dengan isi ${safeFillPercent}%`}
    >
      <div className="absolute inset-x-6 top-6 bottom-7 flex items-center justify-center">
        <div
          className={
            shape === "rectangular"
              ? "relative h-[74%] w-[82%] overflow-hidden rounded-[1.7rem] border border-slate-300 bg-white/80 shadow-[0_18px_45px_rgba(15,23,42,0.12)]"
              : "relative h-[68%] w-[86%] overflow-hidden rounded-full border border-slate-300 bg-white/80 shadow-[0_18px_45px_rgba(15,23,42,0.12)]"
          }
        >
          <div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-cyan-700 via-sky-500 to-cyan-300 transition-[height] duration-700 ease-out"
            style={fillStyle}
          />
          <div
            className="absolute inset-x-0 h-px bg-cyan-200/80"
            style={surfaceStyle}
          />
          <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/95 via-white/45 to-transparent" />
          {shape === "cylinder" ? (
            <>
              <div className="absolute inset-y-0 left-0 w-[18%] rounded-full border-r border-slate-300/70 bg-white/20" />
              <div className="absolute inset-y-0 right-0 w-[18%] rounded-full border-l border-slate-300/70 bg-white/20" />
            </>
          ) : null}
        </div>

        <div className="absolute left-1/2 top-8 -translate-x-1/2">
          <span className="block size-6 rounded-full border-4 border-red-100 bg-red-600 shadow-[0_0_0_7px_rgba(239,68,68,0.12)]" />
          <span className="mx-auto block h-20 w-px border-l border-dashed border-red-500" />
        </div>
      </div>
    </div>
  );
}
