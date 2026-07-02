"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";
import {
  SIMPLE_TANK_CHART_RANGES,
  type SimpleTankChartRangeKey,
  type SimpleTankTrendByRange,
} from "@/features/monitoring/lib/simple-tank-detail-model";

type SimpleTankVolumeChartProps = {
  trends: SimpleTankTrendByRange;
  capacityLiter: number;
};

const FALLBACK_CHART_SIZE = {
  width: 960,
  height: 288,
};

function formatLiter(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function SimpleTankVolumeChart({
  trends,
  capacityLiter,
}: SimpleTankVolumeChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedRange, setSelectedRange] =
    useState<SimpleTankChartRangeKey>("day");
  const [chartSize, setChartSize] = useState(FALLBACK_CHART_SIZE);
  const trend = trends[selectedRange] ?? trends.day;
  const padding = useMemo(
    () => ({
      top: 20,
      right: chartSize.width < 560 ? 18 : 34,
      bottom: 44,
      left: chartSize.width < 560 ? 54 : 70,
    }),
    [chartSize.width],
  );

  useEffect(() => {
    const svg = svgRef.current;

    if (!svg) {
      return;
    }

    function syncChartSize() {
      if (!svg) {
        return;
      }

      const rect = svg.getBoundingClientRect();
      const nextWidth = Math.max(Math.round(rect.width), 320);
      const nextHeight = Math.max(Math.round(rect.height), 220);

      setChartSize((currentSize) => {
        if (
          currentSize.width === nextWidth &&
          currentSize.height === nextHeight
        ) {
          return currentSize;
        }

        return {
          height: nextHeight,
          width: nextWidth,
        };
      });
    }

    syncChartSize();

    const resizeObserver = new ResizeObserver(syncChartSize);
    resizeObserver.observe(svg);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const chart = useMemo(() => {
    const maxVolume = Math.max(
      capacityLiter,
      ...trend.points.map((point) => point.volumeLiter),
      1,
    );
    const innerWidth = chartSize.width - padding.left - padding.right;
    const innerHeight = chartSize.height - padding.top - padding.bottom;
    const bottom = chartSize.height - padding.bottom;

    const coordinates = trend.points.map((point) => {
      const x = padding.left + clamp(point.xRatio, 0, 1) * innerWidth;
      const y =
        padding.top +
        (1 - clamp(point.volumeLiter / maxVolume, 0, 1)) * innerHeight;

      return {
        ...point,
        x,
        y,
      };
    });
    const linePath = coordinates
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");
    const areaPath =
      coordinates.length > 0
        ? `${linePath} L ${coordinates.at(-1)?.x} ${bottom} L ${coordinates[0].x} ${bottom} Z`
        : "";
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
      const value = maxVolume * ratio;
      const y = padding.top + (1 - ratio) * innerHeight;

      return {
        value,
        y,
      };
    });

    return {
      coordinates,
      linePath,
      areaPath,
      yTicks,
      bottom,
      innerWidth,
    };
  }, [capacityLiter, chartSize.height, chartSize.width, padding, trend.points]);

  const activePoint =
    activeIndex === null ? null : chart.coordinates[activeIndex] ?? null;

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;

    if (!svg || chart.coordinates.length === 0) {
      return;
    }

    const rect = svg.getBoundingClientRect();
    const pointerX =
      ((event.clientX - rect.left) / rect.width) * chartSize.width;
    const nearestIndex = chart.coordinates.reduce(
      (nearest, point, index) => {
        const nearestDistance = Math.abs(
          chart.coordinates[nearest].x - pointerX,
        );
        const pointDistance = Math.abs(point.x - pointerX);

        return pointDistance < nearestDistance ? index : nearest;
      },
      0,
    );

    setActiveIndex(nearestIndex);
  }

  if (trend.points.length === 0) {
    return (
      <div className="mt-5 grid min-h-72 place-items-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center">
        <div>
          <p className="text-base font-semibold text-zinc-950">
            Belum ada riwayat volume
          </p>
          <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
            Grafik akan tampil setelah perangkat mengirim pembacaan volume.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 min-w-0 max-w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="grid grid-cols-3 rounded-lg border border-zinc-300 bg-zinc-50 p-1"
          aria-label="Pilih rentang grafik"
        >
          {SIMPLE_TANK_CHART_RANGES.map((option) => (
            <button
              aria-pressed={selectedRange === option.key}
              className={`h-10 rounded-md px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/15 ${
                selectedRange === option.key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-zinc-600 hover:bg-white hover:text-blue-700"
              }`}
              key={option.key}
              onClick={() => {
                setSelectedRange(option.key);
                setActiveIndex(null);
              }}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
        <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
          {trend.points.length} titik data
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-1 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
        <span>{trend.range.bucketLabel}</span>
        <span>
          {trend.totalSlots} slot waktu, sumbu mengikuti waktu aktual
        </span>
      </div>

      <div className="mt-4 relative min-w-0 max-w-full overflow-hidden rounded-lg bg-zinc-50 p-3 ring-1 ring-zinc-100">
        <svg
          ref={svgRef}
          className="block aspect-[640/260] h-auto w-full min-w-0 max-w-full touch-none sm:aspect-auto sm:h-72"
          role="img"
          aria-label="Grafik garis perubahan volume solar"
          viewBox={`0 0 ${chartSize.width} ${chartSize.height}`}
          onPointerLeave={() => setActiveIndex(null)}
          onPointerMove={handlePointerMove}
        >
          <defs>
            <linearGradient id="simple-volume-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          <rect
            fill="#fafafa"
            height={chartSize.height}
            rx="12"
            width={chartSize.width}
          />

          {chart.yTicks.map((tick) => (
            <g key={tick.y}>
              <line
                stroke="#e4e4e7"
                strokeDasharray="4 6"
                strokeWidth="1"
                x1={padding.left}
                x2={chartSize.width - padding.right}
                y1={tick.y}
                y2={tick.y}
              />
              <text
                fill="#71717a"
                fontSize="12"
                fontWeight="600"
                textAnchor="end"
                x={padding.left - 12}
                y={tick.y + 4}
              >
                {formatLiter(tick.value)} L
              </text>
            </g>
          ))}

          <path d={chart.areaPath} fill="url(#simple-volume-area)" />
          <path
            d={chart.linePath}
            fill="none"
            stroke="#2563eb"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.75"
          />

          {chart.coordinates.map((point, index) => (
            <circle
              className="transition"
              cx={point.x}
              cy={point.y}
              fill={activeIndex === index ? "#ffffff" : "#2563eb"}
              key={`${point.receivedAt}-${index}`}
              r={activeIndex === index ? 5.5 : 2.4}
              stroke="#2563eb"
              strokeWidth={activeIndex === index ? "3" : "1.5"}
            />
          ))}

          {activePoint ? (
            <g>
              <line
                stroke="#2563eb"
                strokeDasharray="4 6"
                strokeOpacity="0.45"
                strokeWidth="1.5"
                x1={activePoint.x}
                x2={activePoint.x}
                y1={padding.top}
                y2={chart.bottom}
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                fill="#1d4ed8"
                r="7"
                stroke="#ffffff"
                strokeWidth="3"
              />
            </g>
          ) : null}

          {trend.xTicks.length > 0 ? (
            <>
              {trend.xTicks.map((tick, index) => {
                const x = padding.left + tick.xRatio * chart.innerWidth;
                const isFirst = index === 0;
                const isLast = index === trend.xTicks.length - 1;

                return (
                  <text
                    fill="#71717a"
                    fontSize="12"
                    fontWeight="600"
                    key={`${tick.label}-${index}`}
                    textAnchor={isFirst ? "start" : isLast ? "end" : "middle"}
                    x={x}
                    y={chartSize.height - 12}
                  >
                    {tick.label}
                  </text>
                );
              })}
            </>
          ) : null}
        </svg>

        {activePoint ? (
          <div
            className={`pointer-events-none absolute max-w-52 rounded-lg bg-white px-3 py-2 text-sm shadow-lg ring-1 ring-zinc-200 ${
              activePoint.x > chartSize.width * 0.7
                ? "-translate-x-full"
                : "translate-x-3"
            }`}
            style={{
              left: `${(activePoint.x / chartSize.width) * 100}%`,
              top: `${Math.max((activePoint.y / chartSize.height) * 100, 8)}%`,
            }}
          >
            <p className="font-semibold text-zinc-950">
              {formatLiter(activePoint.volumeLiter)} /{" "}
              {formatLiter(capacityLiter)} L
            </p>
            <p className="mt-1 text-xs font-medium text-zinc-500">
              {activePoint.fullTimeLabel}
            </p>
            {activePoint.sampleCount > 1 ? (
              <p className="mt-1 text-xs font-medium text-zinc-500">
                rata-rata {activePoint.sampleCount} data
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
