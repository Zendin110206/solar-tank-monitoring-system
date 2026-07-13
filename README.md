# FTM — Fuel Tank Management

<div align="center">

<img src="public/logo/android-icon-192x192.png" alt="FTM" width="112" />

**Platform IoT untuk pemantauan bahan bakar, pengelolaan perangkat, dan visibilitas operasional tangki.**

[![Status](https://img.shields.io/badge/status-active_operational_pilot-0f766e)](docs/current-operational-truth.md)
[![CI](https://github.com/Zendin110206/solar-tank-monitoring-system/actions/workflows/ci.yml/badge.svg)](https://github.com/Zendin110206/solar-tank-monitoring-system/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.9-111827)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-2563eb)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-16a34a)](LICENSE)

[Live application](https://solar-tank-monitoring-system.vercel.app) · [Operational status](docs/current-operational-truth.md) · [Architecture](docs/architecture.md) · [User manual](docs/panduan-user-manual-ftm.pdf)

</div>

## Overview

FTM menghubungkan sensor tangki, perangkat ESP8266, layanan ingest, MySQL, dan
dashboard web dalam satu alur pemantauan. Platform menyediakan pembacaan terkini,
riwayat volume, estimasi runtime, status koneksi perangkat, pengelolaan akun,
provisioning perangkat, serta dukungan operasional melalui Telegram dan helpdesk.

Sistem saat ini digunakan sebagai **pilot operasional aktif** dalam konteks
infrastruktur Telkom Indonesia/Telkominfra, dengan cakupan awal TIF
Pasuruan–Sidoarjo. Deployment aktif berjalan di Vercel dan menerima telemetry
dari perangkat lapangan yang terdaftar pada Aiven MySQL.

FTM dikelola sebagai sistem yang terus berkembang. Penguatan keamanan perangkat,
observability, pemulihan data, kontrol akses per lokasi, dan validasi kapasitas
menjadi bagian dari roadmap menuju penggunaan pada cakupan yang lebih luas.

> Status pilot tidak menyatakan FTM sebagai produk nasional atau sistem
> keselamatan yang telah memperoleh persetujuan produksi korporat. Keputusan
> operasional tetap mengikuti verifikasi lapangan dan prosedur yang berlaku.

## Operational Status

| Area | Status |
|---|---|
| Lifecycle | Active operational pilot; maintained and under active development |
| Initial scope | TIF Pasuruan–Sidoarjo |
| Registered deployment | 3 lokasi, 3 tangki, dan 3 perangkat pada snapshot operasional terakhir |
| Application hosting | Vercel |
| Operational database | Aiven MySQL |
| Live monitoring | Snapshot terbaru per perangkat dengan refresh dashboard 20 detik |
| Historical telemetry | Agregat 5 menit untuk mean, minimum, maksimum, dan jumlah sampel |
| Access model | Akun terverifikasi dengan peran admin dan user |

Angka deployment bersifat dinamis. Status terkini, batas klaim, dan catatan
operasional dipelihara di
[Current Operational Truth](docs/current-operational-truth.md).

## System Architecture

```text
Ultrasonic sensor
       │
       ▼
ESP8266 device
       │  authenticated telemetry
       ▼
POST /api/ingest
       │
       ├── device identity and payload validation
       ├── configuration normalization
       └── registry consistency checks
       │
       ▼
Aiven MySQL
       ├── latest snapshot per device ──► live dashboard
       └── 5-minute rollup ─────────────► charts and CSV export
       │
       ▼
Next.js application on Vercel
       ├── operator and administrator dashboard
       ├── account and device management
       └── Telegram and helpdesk integration
```

Detail komponen, batas tanggung jawab, serta hubungan antarfitur tersedia di
[Architecture](docs/architecture.md) dan
[System Boundaries](docs/system-boundaries.md).

## Data Lifecycle

FTM memisahkan data untuk tampilan langsung dan analisis historis:

- **Latest snapshot** menyimpan satu pembacaan terbaru untuk setiap perangkat.
  Nilainya diperbarui setiap telemetry baru diterima dan menjadi sumber utama
  dashboard real-time.
- **Five-minute rollup** merangkum sampel menjadi mean, minimum, maksimum, dan
  jumlah sampel. Model ini mempertahankan informasi analitis dengan pertumbuhan
  storage yang lebih terkendali.
- **Registry data** menyimpan identitas lokasi, tangki, perangkat, parameter
  kapasitas, serta konfigurasi yang telah disetujui.
- **Audit data** mencatat perubahan penting pada akun dan proses administratif.

Kontrak dan struktur data dijelaskan lebih lanjut dalam
[Data Model](docs/data-model.md), [API Contract](docs/api-contract.md), dan
[Device Ingestion](docs/device-ingestion.md).

## Core Capabilities

### Monitoring

- ringkasan lokasi melalui tampilan kartu dan peta;
- filter Regional, Wilayah, Area, STO, dan status perangkat;
- pembacaan volume, persentase isi, waktu data diterima, dan online/offline;
- estimasi runtime berdasarkan kapasitas serta konsumsi yang dikonfigurasi;
- tren harian, mingguan, dan bulanan;
- ekspor CSV mengikuti rentang data yang dipilih;
- deteksi perbedaan konfigurasi perangkat dan registry.

### Device lifecycle

- pengajuan perangkat dan data lokasi oleh user;
- review serta persetujuan oleh admin;
- perhitungan parameter kapasitas dan konsumsi;
- pembuatan device key, konfigurasi, dan paket firmware per perangkat;
- aktivasi setelah first valid ping;
- pengelolaan data uji dan reset reading secara selektif.

### Identity and access

- registrasi, verifikasi email, login, dan pemulihan kata sandi;
- peran admin dan user;
- session cookie `httpOnly` dan password hashing Argon2id;
- OTP untuk tindakan administratif tertentu;
- Cloudflare Turnstile untuk formulir publik saat diaktifkan;
- satu identitas Telegram untuk satu akun FTM;
- pencabutan sesi dan audit aktivitas penting.

### Operations

- helpdesk web dengan notifikasi Telegram;
- perintah Telegram untuk bantuan, status akun, dan akses dashboard;
- health check dan readiness check;
- backup MySQL manual maupun terjadwal;
- migration database berurutan dan aman dijalankan ulang;
- automated quality gate melalui GitHub Actions.

## Technology Stack

| Layer | Technology |
|---|---|
| Web application | Next.js 16 App Router, React 19, TypeScript strict |
| Interface | Tailwind CSS 4, lucide-react, Three.js |
| Data | MySQL, `mysql2`, Aiven |
| Identity and communication | Argon2id, SMTP email, Cloudflare Turnstile, Telegram Bot API |
| Device | ESP8266, ultrasonic sensor, per-device firmware package |
| Hosting | Vercel |
| Quality | Vitest, ESLint, TypeScript, Next.js production build, GitHub Actions |

## Repository Structure

```text
.
├── .github/                 # CI workflows and issue templates
├── config/                  # public-safe registry templates
├── database/
│   ├── migrations/         # ordered MySQL schema migrations
│   └── seeds/              # development-only sample data
├── docs/                    # architecture, operations, safety, and manuals
├── firmware/templates/      # device firmware templates
├── scripts/                 # migration, backup, simulator, and smoke-test tools
└── src/
    ├── app/                 # Next.js pages and Route Handlers
    ├── components/          # shared UI components
    └── features/
        ├── auth/            # accounts, sessions, email, Telegram, and audit
        ├── helpdesk/        # web and Telegram support workflow
        └── monitoring/      # domain logic, repositories, dashboard, and tests
```

## Getting Started

### Requirements

- Node.js 20 or newer;
- pnpm 9.15.3;
- MySQL for persistent-storage development.

### Development server

```powershell
git clone https://github.com/Zendin110206/solar-tank-monitoring-system.git
cd solar-tank-monitoring-system
corepack enable
pnpm install
pnpm dev
```

The application is available at `http://localhost:3000`.

Development uses an in-memory store and public-safe sample data by default.
Device telemetry can be simulated without physical hardware:

```powershell
pnpm simulate:device --once
```

### MySQL development environment

Create `.env.local` from `.env.example`, provide credentials for an authorized
development database, then initialize the schema:

```powershell
pnpm db:setup:mysql
pnpm auth:create-admin
pnpm dev
```

`db:setup:mysql` includes sample seeds and is intended for an empty development
database. An existing database must be backed up before its ordered migrations
are applied, and must not receive development seeds.

```powershell
pnpm db:backup:mysql
pnpm db:migrate:mysql
pnpm db:migrate:auth
pnpm db:migrate:auth-recovery
pnpm db:migrate:device-provisioning
pnpm db:migrate:device-request-fields
pnpm db:migrate:helpdesk
pnpm db:migrate:reading-rollup
pnpm db:migrate:auth-telegram
pnpm db:migrate:site-taxonomy
```

Deployment requirements, migration order, and readiness checks are documented
in [Deployment](docs/deployment.md).

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Start the Turbopack development server |
| `pnpm dev:lan` | Expose the development server on an authorized local network |
| `pnpm dev:webpack` | Use Webpack as a compatibility fallback |
| `pnpm simulate:device` | Send development telemetry to the ingest endpoint |
| `pnpm pilot:hash-key` | Generate credentials for authorized device onboarding |
| `pnpm pilot:registry` | Validate and apply a local, untracked registry file |
| `pnpm pilot:smoke` | Exercise ingestion with a device-format payload |
| `pnpm db:backup:mysql` | Create a MySQL backup in the Git-ignored backup directory |
| `pnpm db:migrate:*` | Apply an individual schema migration |
| `pnpm check` | Run typecheck, lint, tests, and the production build |

## Configuration and Security

`.env.example` documents configuration names without providing operational
values. Production data and credentials are excluded from this repository.

- secrets, database URLs, device keys, tokens, and account data must remain
  outside version control;
- only browser-safe values may use the `NEXT_PUBLIC_` prefix;
- operational registries and precise location data must not be committed;
- `config/pilot-registry.example.json` is a public template; `*.local.json`
  remains untracked;
- seeds and simulator payloads are development fixtures, not operational data;
- security reports follow the private process in [SECURITY.md](SECURITY.md).

Operational and physical limitations are maintained in
[Safety and Limitations](docs/safety-and-limitations.md).

## Quality Assurance

Every change is expected to pass the complete project check:

```powershell
pnpm check
```

The command runs TypeScript type checking, ESLint, the Vitest suite, and a
Next.js production build. Runtime changes also require focused validation of the
affected flow. Software checks do not replace sensor calibration, installation
inspection, or operational safety procedures.

## Product Roadmap

Development remains active across the following workstreams:

- firmware transport security, OTA controls, and diagnostic hardening;
- documented calibration and measurement tolerance per tank;
- automated alerts for critical levels, stale devices, and delivery failures;
- location-scoped access control for larger operational teams;
- encrypted backup retention and periodic restore drills;
- centralized observability, incident handling, and credential rotation;
- load, quota, and cost validation before wider deployment;
- release management and operational ownership for long-term maintenance.

Priorities and readiness gates are tracked in
[Roadmap](docs/roadmap.md) and [Pilot Readiness](docs/pilot-readiness.md).

## Documentation

| Document | Scope |
|---|---|
| [Current Operational Truth](docs/current-operational-truth.md) | Current deployment state and claim boundaries |
| [Architecture](docs/architecture.md) | Components, dependencies, and data flow |
| [API Contract](docs/api-contract.md) | Endpoint contracts and payload formats |
| [Data Model](docs/data-model.md) | Sites, tanks, devices, readings, and provisioning |
| [Device Ingestion](docs/device-ingestion.md) | Authentication, normalization, and ingest validation |
| [Deployment](docs/deployment.md) | Environments, migrations, readiness, and release flow |
| [Database Backup](docs/database-backup.md) | Backup, retention, and recovery boundaries |
| [Safety and Limitations](docs/safety-and-limitations.md) | Software, data, hardware, and operational limits |
| [Reviewer Quickstart](docs/reviewer-quickstart.md) | Technical review path |
| [User Manual](docs/panduan-user-manual-ftm.pdf) | End-user guide |

## Contributing

Contributions follow [CONTRIBUTING.md](CONTRIBUTING.md). Changes should keep
fixtures public-safe, preserve the documented security boundaries, include
appropriate tests, and pass the project quality gate.

| Contributor | Primary contributions |
|---|---|
| [Muhammad Zaenal Abidin Abdurrahman](https://github.com/Zendin110206) | Project coordination, application architecture, backend and database, identity, deployment, integration, testing, and review |
| [Yattaqi Muazirul Mulki](https://github.com/ukiirving) | Interface design and application development |
| [Astra](https://github.com/Ata22) | Device and firmware development, field testing, Telegram integration, and operational input |

## License

Source code is available under the [MIT License](LICENSE). Names, logos,
credentials, operational data, and third-party information are not licensed by
that grant.
