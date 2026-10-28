// Pembantu membaca isian formulir di server action.

export function getRequiredFormValue(formData: FormData, key: string): string {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    throw new Error("Data aksi admin belum lengkap.");
  }

  return value;
}
