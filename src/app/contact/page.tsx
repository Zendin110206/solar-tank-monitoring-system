import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Kontak | SolarTank",
  description:
    "Akses kontak operasional SolarTank dipindahkan ke area dashboard.",
};

export default function ContactRedirectPage() {
  redirect("/dashboard/contact");
}
