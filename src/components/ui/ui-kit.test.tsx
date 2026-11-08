import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Card } from "./card";
import { ActionMessage, FormErrorMessage } from "./message";
import { SectionHeader } from "./section-header";
import { StatusPill } from "./status-pill";

// Setiap komponen harus menghasilkan HTML yang sama persis dengan markup yang dulu
// ditulis langsung di halaman, supaya tampilannya tidak berubah.
const html = renderToStaticMarkup;

describe("kit UI", () => {
  it("Card sama dengan <section> kartu standar", () => {
    expect(html(<Card>isi</Card>)).toBe(
      html(
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          isi
        </section>,
      ),
    );
  });

  it("Card meneruskan elemen, kelas tambahan di depan, dan atribut lain", () => {
    expect(
      html(
        <Card as="article" className="animate-soft-fade min-w-0" id="ringkasan">
          isi
        </Card>,
      ),
    ).toBe(
      html(
        <article
          className="animate-soft-fade min-w-0 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
          id="ringkasan"
        >
          isi
        </article>,
      ),
    );
  });

  it("StatusPill sama dengan lencana status lama", () => {
    expect(
      html(
        <StatusPill badgeClass="bg-red-50 text-red-700" dotClass="bg-red-500">
          Kritis
        </StatusPill>,
      ),
    ).toBe(
      html(
        <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 bg-red-50 text-red-700">
          <span className="size-2 rounded-full bg-red-500" />
          Kritis
        </span>,
      ),
    );
  });

  it("FormErrorMessage sama dengan kotak error formulir lama, termasuk kelas tambahan", () => {
    expect(
      html(<FormErrorMessage className="mt-4">Gagal.</FormErrorMessage>),
    ).toBe(
      html(
        <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">
          Gagal.
        </div>,
      ),
    );
  });

  it("ActionMessage sama dengan pesan hasil aksi lama", () => {
    expect(html(<ActionMessage tone="danger">Gagal.</ActionMessage>)).toBe(
      html(
        <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold leading-6 text-red-700">
          Gagal.
        </p>,
      ),
    );
    expect(html(<ActionMessage tone="success">Berhasil.</ActionMessage>)).toBe(
      html(
        <p className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-semibold leading-6 text-emerald-700">
          Berhasil.
        </p>,
      ),
    );
  });

  it("SectionHeader sama dengan judul bagian lama", () => {
    const oldHeader = (descriptionClass: string) =>
      html(
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-600">
            Lokasi
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal text-zinc-950">
            Peta tangki
          </h2>
          <p className={descriptionClass}>Posisi setiap tangki.</p>
        </div>,
      );

    expect(
      html(
        <SectionHeader
          label="Lokasi"
          title="Peta tangki"
          description="Posisi setiap tangki."
        />,
      ),
    ).toBe(oldHeader("mt-2 text-sm leading-6 text-zinc-500"));
    expect(
      html(
        <SectionHeader
          label="Lokasi"
          title="Peta tangki"
          description="Posisi setiap tangki."
          limitDescriptionWidth
        />,
      ),
    ).toBe(oldHeader("mt-2 max-w-3xl text-sm leading-6 text-zinc-500"));
  });
});
