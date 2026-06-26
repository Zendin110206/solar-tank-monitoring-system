"use server";

import type {
  RegisterFieldValues,
  RegisterFormState,
} from "./form-state";

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{4,32}$/;
const PHONE_PATTERN = /^(?:\+62|62|0)8[1-9][0-9]{7,11}$/;
const PUBLIC_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.id",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
]);

function nextState(
  previousState: RegisterFormState,
  status: RegisterFormState["status"],
  message: string,
  fields: RegisterFieldValues,
): RegisterFormState {
  return {
    status,
    message,
    submissionId: previousState.submissionId + 1,
    fields,
  };
}

function isCompanyEmail(email: string) {
  const parts = email.toLowerCase().split("@");

  if (parts.length !== 2 || !parts[0] || !parts[1]?.includes(".")) {
    return false;
  }

  return !PUBLIC_EMAIL_DOMAINS.has(parts[1]);
}

export async function submitRegistration(
  previousState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "")
    .replace(/[\s()-]/g, "")
    .trim();
  const position = String(formData.get("position") ?? "").trim();
  const stoLocation = String(formData.get("stoLocation") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const agreementAccepted = formData.get("agreement") === "on";
  const fields = {
    fullName,
    username,
    email,
    phone,
    position,
    stoLocation,
    agreementAccepted,
  };

  if (fullName.length < 3) {
    return nextState(
      previousState,
      "error",
      "Masukkan nama lengkap minimal 3 karakter.",
      fields,
    );
  }

  if (!USERNAME_PATTERN.test(username)) {
    return nextState(
      previousState,
      "error",
      "Nama pengguna harus 4–32 karakter dan hanya berisi huruf, angka, titik, garis bawah, atau tanda hubung.",
      fields,
    );
  }

  if (!isCompanyEmail(email)) {
    return nextState(
      previousState,
      "error",
      "Gunakan email perusahaan yang valid, bukan Gmail atau layanan email publik.",
      fields,
    );
  }

  if (!PHONE_PATTERN.test(phone)) {
    return nextState(
      previousState,
      "error",
      "Masukkan nomor telepon Indonesia yang valid.",
      fields,
    );
  }

  if (position.length < 2 || stoLocation.length < 2) {
    return nextState(
      previousState,
      "error",
      "Lengkapi jabatan dan lokasi STO pengguna.",
      fields,
    );
  }

  if (
    password.length < 8 ||
    !/[a-zA-Z]/.test(password) ||
    !/[0-9]/.test(password)
  ) {
    return nextState(
      previousState,
      "error",
      "Kata sandi minimal 8 karakter serta mengandung huruf dan angka.",
      fields,
    );
  }

  if (password !== confirmPassword) {
    return nextState(
      previousState,
      "error",
      "Konfirmasi kata sandi belum sama.",
      fields,
    );
  }

  if (!agreementAccepted) {
    return nextState(
      previousState,
      "error",
      "Konfirmasikan bahwa data pendaftaran sudah benar.",
      fields,
    );
  }

  // Integrasi database, pengiriman OTP, dan penetapan role user dilakukan
  // oleh backend. Kata sandi tidak disimpan atau dikembalikan dari action ini.
  return nextState(
    previousState,
    "info",
    "Data pendaftaran valid. Form siap disambungkan ke backend dan verifikasi OTP email perusahaan.",
    {
      fullName: "",
      username: "",
      email: "",
      phone: "",
      position: "",
      stoLocation: "",
      agreementAccepted: false,
    },
  );
}
