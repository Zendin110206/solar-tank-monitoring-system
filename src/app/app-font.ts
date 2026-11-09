import { Figtree } from "next/font/google";

// Huruf seluruh aplikasi. Berkasnya diunduh saat build dan disajikan dari
// server FTM sendiri, jadi browser tidak meminta apa pun ke pihak ketiga.
export const appFont = Figtree({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-app",
});
