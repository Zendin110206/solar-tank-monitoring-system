import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Kontak | FTM",
  description:
    "Akses kontak operasional FTM dipindahkan ke area dashboard.",
};

export default function ContactRedirectPage() {
  redirect("/dashboard/contact");
}
