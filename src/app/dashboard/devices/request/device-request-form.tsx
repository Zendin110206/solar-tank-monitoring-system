"use client";

import {
  AlertCircle,
  CheckCircle2,
  Fuel,
  Gauge,
  MapPin,
  Send,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type {
  MonitoringHardwareProfile,
  TankShape,
} from "@/features/monitoring/types/monitoring";
import {
  createDeviceRequestAction,
  type DeviceRequestFormState,
} from "./actions";

const INITIAL_STATE: DeviceRequestFormState = {
  status: "idle",
  message: "",
};

function FormField({
  children,
  className = "",
  help,
  label,
}: {
  children: ReactNode;
  className?: string;
  help?: string;
  label: string;
}) {
  return (
    <label
      className={`flex h-full flex-col gap-2 text-sm font-semibold text-zinc-900 ${className}`}
    >
      <span>{label}</span>
      {children}
      {help ? (
        <span className="min-h-5 text-xs font-normal leading-5 text-zinc-500">
          {help}
        </span>
      ) : null}
    </label>
  );
}

function SectionHeader({
  children,
  icon,
  title,
}: {
  children: ReactNode;
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
        {icon}
      </span>
      <div>
        <h3 className="text-base font-semibold text-zinc-950">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-zinc-500">{children}</p>
      </div>
    </div>
  );
}

function inputClassName(extra = "") {
  return `h-11 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-600/15 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 ${extra}`;
}

function NumberInput({
  max,
  min = "0",
  name,
  placeholder,
  required,
}: {
  max?: string;
  min?: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <input
      className={inputClassName()}
      inputMode="decimal"
      max={max}
      min={min}
      name={name}
      placeholder={placeholder}
      required={required}
      step="0.01"
      type="number"
    />
  );
}

function SubmitButton({
  disabled,
}: {
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/20 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 disabled:shadow-none sm:w-auto"
      disabled={disabled || pending}
      type="submit"
    >
      <Send className="size-4" aria-hidden="true" />
      {pending ? "Mengirim..." : "Ajukan perangkat"}
    </button>
  );
}

function ActionMessage({ state }: { state: DeviceRequestFormState }) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  const isSuccess = state.status === "success";
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;

  return (
    <div
      className={`rounded-lg border p-4 text-sm ${
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
      role={isSuccess ? "status" : "alert"}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-semibold">{state.message}</p>
          {state.requestCode ? (
            <p className="mt-1 text-xs">Kode pengajuan: {state.requestCode}</p>
          ) : null}
          {state.issues && state.issues.length > 0 ? (
            <ul className="mt-3 grid gap-1 text-xs leading-5">
              {state.issues.map((issue) => (
                <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function DeviceRequestForm({
  hardwareProfiles,
}: {
  hardwareProfiles: MonitoringHardwareProfile[];
}) {
  const [state, formAction] = useActionState(
    createDeviceRequestAction,
    INITIAL_STATE,
  );
  const [tankShape, setTankShape] = useState<TankShape>("rectangular");
  const matchingProfiles = useMemo(
    () =>
      hardwareProfiles.filter(
        (profile) =>
          profile.supportedTankShape === "any" ||
          profile.supportedTankShape === tankShape,
      ),
    [hardwareProfiles, tankShape],
  );
  const canSubmit = matchingProfiles.length > 0;

  return (
    <form action={formAction} className="mx-auto grid max-w-6xl gap-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          "Kode STO dan kode device dibuat otomatis",
          "Device key dibuat setelah admin approve",
          "Batas level dan interval kirim memakai standar sistem",
        ].map((item) => (
          <div
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold leading-6 text-zinc-700"
            key={item}
          >
            {item}
          </div>
        ))}
      </div>

      <section className="grid gap-5 border-t border-zinc-100 pt-5">
        <SectionHeader
          icon={<MapPin className="size-5" aria-hidden="true" />}
          title="Lokasi STO"
        >
          Data ini dipakai untuk nama lokasi, wilayah kerja, dan titik peta.
        </SectionHeader>

        <div className="grid max-w-5xl gap-4 lg:grid-cols-2">
          <FormField label="Nama STO" help="Contoh: STO Bangil atau STO TPH">
            <input
              className={inputClassName()}
              name="siteName"
              placeholder="STO Bangil"
              required
            />
          </FormField>
          <FormField
            label="Wilayah STO"
            help="Contoh: Pasuruan, Sidoarjo, Jombang"
          >
            <input
              className={inputClassName()}
              name="areaLabel"
              placeholder="Pasuruan"
              required
            />
          </FormField>
          <FormField label="Latitude" help="Boleh dikosongkan jika belum ada.">
            <NumberInput
              max="90"
              min="-90"
              name="latitude"
              placeholder="-7.7200"
            />
          </FormField>
          <FormField label="Longitude" help="Boleh dikosongkan jika belum ada.">
            <NumberInput
              max="180"
              min="-180"
              name="longitude"
              placeholder="112.8800"
            />
          </FormField>
        </div>
      </section>

      <section className="grid gap-5 border-t border-zinc-100 pt-5">
        <SectionHeader
          icon={<Fuel className="size-5" aria-hidden="true" />}
          title="Sensor dan Tangki"
        >
          Pilih tipe tangki, mode sensor, profile hardware, dan dimensi fisik
          yang dipakai di lokasi.
        </SectionHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            className={`rounded-lg border p-4 text-left transition ${
              tankShape === "rectangular"
                ? "border-blue-500 bg-blue-50 ring-4 ring-blue-600/10"
                : "border-zinc-200 bg-white hover:border-blue-200"
            }`}
            onClick={() => setTankShape("rectangular")}
            type="button"
          >
            <span className="text-sm font-semibold text-zinc-950">
              Tangki balok
            </span>
            <span className="mt-1 block text-xs leading-5 text-zinc-500">
              Panjang, lebar, tinggi, dan tinggi sensor.
            </span>
          </button>
          <button
            className={`rounded-lg border p-4 text-left transition ${
              tankShape === "horizontal-cylinder"
                ? "border-blue-500 bg-blue-50 ring-4 ring-blue-600/10"
                : "border-zinc-200 bg-white hover:border-blue-200"
            }`}
            onClick={() => setTankShape("horizontal-cylinder")}
            type="button"
          >
            <span className="text-sm font-semibold text-zinc-950">
              Tangki silinder horizontal
            </span>
            <span className="mt-1 block text-xs leading-5 text-zinc-500">
              Panjang tabung, diameter, dan tinggi sensor.
            </span>
          </button>
          <input name="tankShape" type="hidden" value={tankShape} />
        </div>

        <div className="grid max-w-5xl gap-4 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(20rem,1fr)]">
          <FormField
            label="Mode sensor"
            help="Paket firmware aktif saat ini untuk sensor fuel."
          >
            <select className={inputClassName()} name="deviceSensorType" required>
              <option value="fuel">Sensor fuel</option>
              <option value="energy" disabled>
                Sensor energy (belum aktif)
              </option>
            </select>
          </FormField>
          <FormField
            label="Profil hardware"
            help="Profile menentukan board, sensor, dan pin yang digunakan."
          >
            <select
              className={inputClassName()}
              disabled={!canSubmit}
              key={tankShape}
              name="hardwareProfileId"
              required
            >
              {matchingProfiles.length === 0 ? (
                <option value="">Belum ada profil aktif untuk tipe ini</option>
              ) : (
                matchingProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name} ({profile.triggerPin}/{profile.echoPin})
                  </option>
                ))
              )}
            </select>
          </FormField>
        </div>

        <div className="grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          <FormField label="Kapasitas liter">
            <NumberInput name="capacityLiter" placeholder="540" required />
          </FormField>
          <FormField label="Panjang cm">
            <NumberInput name="lengthCm" placeholder="150" required />
          </FormField>
          {tankShape === "rectangular" ? (
            <>
              <FormField label="Lebar cm">
                <NumberInput name="widthCm" placeholder="60" required />
              </FormField>
              <FormField label="Tinggi cm">
                <NumberInput name="heightCm" placeholder="60" required />
              </FormField>
            </>
          ) : (
            <FormField label="Diameter cm">
              <NumberInput name="diameterCm" placeholder="60" required />
            </FormField>
          )}
          <FormField
            label="Acuan sensor cm"
            help="Tinggi sensor dari atas tangki."
          >
            <NumberInput name="sensorMountHeightCm" placeholder="60" required />
          </FormField>
        </div>
      </section>

      <section className="grid gap-5 border-t border-zinc-100 pt-5">
        <SectionHeader
          icon={<Gauge className="size-5" aria-hidden="true" />}
          title="Beban Genset"
        >
          Sistem menghitung konsumsi solar per jam dari beban lokasi, kapasitas
          diesel engine, dan cos phi.
        </SectionHeader>

        <div className="grid max-w-6xl gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <FormField label="Beban lokasi">
            <NumberInput name="loadValue" placeholder="20" required />
          </FormField>
          <FormField label="Satuan beban">
            <select className={inputClassName()} name="loadUnit" required>
              <option value="kw">kW</option>
              <option value="kva">kVA</option>
            </select>
          </FormField>
          <FormField
            label="Kapasitas diesel engine"
            help="Isi dalam kVA."
          >
            <NumberInput name="dieselEngineCapacityKva" placeholder="40" required />
          </FormField>
          <FormField label="Cos phi" help="Umumnya 0,8. Isi 0 sampai 1.">
            <NumberInput max="1" min="0.01" name="cosPhi" placeholder="0.8" required />
          </FormField>
        </div>
      </section>

      {!canSubmit ? (
        <div className="max-w-5xl rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          Profil perangkat aktif belum tersedia untuk tipe tangki ini. Admin
          perlu mengaktifkan template firmware dan profil hardware di database
          setelah konfigurasi pin dikonfirmasi.
        </div>
      ) : null}

      <ActionMessage state={state} />
      <div className="flex justify-end border-t border-zinc-100 pt-5">
        <SubmitButton disabled={!canSubmit} />
      </div>
    </form>
  );
}
