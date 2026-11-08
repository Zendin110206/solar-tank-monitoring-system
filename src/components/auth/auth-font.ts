import { Figtree } from "next/font/google";

// Huruf halaman akun (masuk, lupa dan atur ulang kata sandi, pengajuan akses). Berkasnya diunduh saat build dan disajikan dari server
// FTM sendiri, jadi browser tidak meminta apa pun ke pihak ketiga.
export const authFont = Figtree({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-auth",
});
