#!/usr/bin/env node

import { createHash, randomBytes } from "node:crypto";
import process from "node:process";

function printHelp() {
  globalThis.console.log(`
Generate key dan hash device pilot.

Pemakaian:
  pnpm pilot:hash-key
  DEVICE_KEY="key-yang-sudah-ada" pnpm pilot:hash-key

Catatan:
  - Simpan device key asli di tempat aman.
  - Jangan commit device key asli.
  - Database hanya perlu nilai hash sha256:...
`);
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  printHelp();
  process.exit(0);
}

const providedKey = process.env.DEVICE_KEY?.trim();
const generatedKey = providedKey || randomBytes(32).toString("hex");
const hash = `sha256:${sha256(generatedKey)}`;

if (providedKey) {
  globalThis.console.log("Mode: hash dari DEVICE_KEY environment");
  globalThis.console.log("Device key asli tidak ditampilkan ulang oleh script.");
} else {
  globalThis.console.log("Mode: generate key baru");
  globalThis.console.log("");
  globalThis.console.log("DEVICE_KEY_ASLI_SIMPAN_AMAN:");
  globalThis.console.log(generatedKey);
}

globalThis.console.log("");
globalThis.console.log("API_KEY_HASH_UNTUK_DATABASE:");
globalThis.console.log(hash);
globalThis.console.log("");
globalThis.console.log(
  "Peringatan: jangan commit key asli, file .env.local, atau file registry lokal.",
);
