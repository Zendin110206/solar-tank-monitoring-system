import { redirect } from "next/navigation";

import { getCurrentSessionUser } from "@/features/auth/server/auth-session";

import { LandingClosingCta } from "./_components/landing-closing-cta";
import { LandingFeatures } from "./_components/landing-features";
import { LandingFooter } from "./_components/landing-footer";
import { LandingHeader } from "./_components/landing-header";
import { LandingHero } from "./_components/landing-hero";
import { LandingWorkflow } from "./_components/landing-workflow";

export default async function Home() {
  const user = await getCurrentSessionUser().catch(() => null);

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main
      id="beranda"
      className="min-h-screen w-full max-w-full overflow-x-hidden bg-white text-zinc-950"
    >
      <LandingHeader />

      <LandingHero />

      <LandingFeatures />

      <LandingWorkflow />

      <LandingClosingCta />

      <LandingFooter />
    </main>
  );
}
