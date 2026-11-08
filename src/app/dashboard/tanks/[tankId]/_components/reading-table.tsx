import { formatNumber } from "@/lib/format";
import { type TankDetail } from "./tank-detail-data";

export function ReadingTable({ tank }: { tank: TankDetail }) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[720px] border-separate border-spacing-y-2 text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-[0.12em] text-zinc-400">
            <th className="px-4 py-2 font-semibold">Jam</th>
            <th className="px-4 py-2 font-semibold">Persen</th>
            <th className="px-4 py-2 font-semibold">Volume</th>
            <th className="px-4 py-2 font-semibold">Ruang kosong</th>
            <th className="px-4 py-2 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {tank.readings.length === 0 ? (
            <tr className="bg-zinc-50">
              <td
                colSpan={5}
                className="rounded-lg px-4 py-8 text-center text-sm text-zinc-500"
              >
                Belum ada pembacaan tersimpan untuk tangki ini.
              </td>
            </tr>
          ) : (
            tank.readings.map((reading, index) => (
              <tr
                key={`${reading.time}-${reading.volumeLiter}-${index}`}
                className="bg-zinc-50"
              >
                <td className="rounded-l-lg px-4 py-4 font-semibold text-zinc-950">
                  {reading.time}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-zinc-200">
                      <span
                        className={`block h-full rounded-full ${
                          reading.percent < 25
                            ? "bg-red-500"
                            : reading.percent < 45
                              ? "bg-amber-500"
                              : "bg-cyan-500"
                        }`}
                        style={{ width: `${reading.percent}%` }}
                      />
                    </div>
                    <span className="font-semibold">{reading.percent}%</span>
                  </div>
                </td>
                <td className="px-4 py-4 font-semibold">
                  {formatNumber(reading.volumeLiter)} L
                </td>
                <td className="px-4 py-4 text-zinc-600">
                  {reading.distanceCm} cm
                </td>
                <td className="rounded-r-lg px-4 py-4">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                    diterima
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
