"use client";

import { useState } from "react";

type TankShapeOption = "rectangular" | "horizontal-cylinder";

type DraftField = {
  label: string;
  placeholder: string;
  suffix?: string;
};

const shapeOptions: Array<{
  value: TankShapeOption;
  label: string;
  description: string;
}> = [
  {
    value: "rectangular",
    label: "Persegi panjang / balok",
    description: "Untuk tangki kotak dengan panjang, lebar, dan tinggi.",
  },
  {
    value: "horizontal-cylinder",
    label: "Silinder / tabung horizontal",
    description: "Untuk tangki tidur dengan diameter dan panjang tabung.",
  },
];

const sharedFields: DraftField[] = [
  { label: "Nama STO", placeholder: "Contoh: STO Pasuruan" },
  { label: "Daerah STO", placeholder: "Contoh: Pasuruan" },
  { label: "Latitude", placeholder: "-7.6500" },
  { label: "Longitude", placeholder: "112.9100" },
  { label: "Kode device", placeholder: "Contoh: demo-psn-01" },
  { label: "Label device", placeholder: "NodeMCU Ultrasonic STO Pasuruan" },
  { label: "Kapasitas", placeholder: "540", suffix: "L" },
  { label: "Konsumsi per jam", placeholder: "25", suffix: "L/jam" },
  { label: "Low level", placeholder: "30", suffix: "%" },
  { label: "Critical level", placeholder: "15", suffix: "%" },
  { label: "Interval kirim", placeholder: "5", suffix: "menit" },
];

const shapeFields: Record<TankShapeOption, DraftField[]> = {
  rectangular: [
    { label: "Panjang tangki", placeholder: "150", suffix: "cm" },
    { label: "Lebar tangki", placeholder: "60", suffix: "cm" },
    { label: "Tinggi tangki", placeholder: "60", suffix: "cm" },
    { label: "Tinggi sensor", placeholder: "60", suffix: "cm" },
  ],
  "horizontal-cylinder": [
    { label: "Panjang tabung", placeholder: "283", suffix: "cm" },
    { label: "Diameter tabung", placeholder: "150", suffix: "cm" },
    { label: "Tinggi sensor", placeholder: "150", suffix: "cm" },
  ],
};

function DraftInput({ field }: { field: DraftField }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-zinc-700">
        {field.label}
      </span>
      <span className="mt-2 flex overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition duration-300 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100">
        <input
          type="text"
          className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-zinc-950 outline-none placeholder:text-zinc-400"
          placeholder={field.placeholder}
          aria-label={field.label}
        />
        {field.suffix ? (
          <span className="grid place-items-center border-l border-zinc-200 bg-zinc-50 px-3 text-xs font-semibold text-zinc-500">
            {field.suffix}
          </span>
        ) : null}
      </span>
    </label>
  );
}

export function TankConfigDraftPanel() {
  const [shape, setShape] = useState<TankShapeOption>("rectangular");
  const dimensionFields = shapeFields[shape];
  const shapeLabel =
    shape === "rectangular" ? "Tangki balok" : "Tangki silinder horizontal";

  return (
    <section
      id="konfigurasi-lokasi"
      className="mt-5 animate-soft-fade rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
    >
      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        {/* Configuration Draft Intro */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-600">
            Konfigurasi lokasi
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal text-zinc-950">
            Form tambah STO dan registrasi device
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Panel ini frontend-only untuk menyiapkan alur penambahan lokasi
            manual, titik latitude/longitude, device pemantau, tipe tangki,
            dimensi fisik, batas level, dan konsumsi operasional.
          </p>

          <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
            Detail tangki akan otomatis memakai label{" "}
            <span className="font-semibold">{shapeLabel}</span> sesuai tipe
            yang dipilih. Marker dashboard disiapkan untuk membaca koordinat
            latitude/longitude dari data STO.
          </div>

          <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-600">
            Satu STO baru selalu dibuat bersama satu device awal supaya tim
            operasional tidak perlu mendaftarkan perangkat di halaman terpisah.
            Penyimpanan sungguhan tetap menunggu backend manajemen lokasi.
          </div>
        </div>

        {/* Shape Selector and Draft Fields */}
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <fieldset>
            <legend className="sr-only">Pilih tipe tangki</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {shapeOptions.map((option) => {
                const isActive = option.value === shape;
                const inputId = `tank-shape-${option.value}`;

                return (
                  <label
                    key={option.value}
                    htmlFor={inputId}
                    className={`block cursor-pointer select-none rounded-lg border p-4 text-left transition duration-300 ${
                      isActive
                        ? "border-blue-500 bg-white shadow-sm ring-4 ring-blue-100"
                        : "border-zinc-200 bg-white/70 hover:border-red-200 hover:bg-white"
                    }`}
                  >
                    <input
                      id={inputId}
                      name="tank-shape"
                      type="radio"
                      value={option.value}
                      checked={isActive}
                      onChange={() => setShape(option.value)}
                      className="sr-only"
                    />
                    <span
                      className={`inline-flex size-3 rounded-full ${
                        isActive ? "bg-blue-600" : "bg-zinc-300"
                      }`}
                    />
                    <span className="mt-3 block text-sm font-semibold text-zinc-950">
                      {option.label}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-zinc-500">
                      {option.description}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {sharedFields.map((field) => (
              <DraftInput key={field.label} field={field} />
            ))}
            {dimensionFields.map((field) => (
              <DraftInput key={field.label} field={field} />
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 text-sm leading-6 text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Form ini belum mengirim data ke backend dan belum membuat device
              sungguhan. Validasi final tetap menunggu modul manajemen lokasi.
            </span>
            <span className="w-fit rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-100">
              frontend-only
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
