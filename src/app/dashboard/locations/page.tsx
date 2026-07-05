import { permanentRedirect } from "next/navigation";

export default function DeprecatedDashboardLocationsPage() {
  permanentRedirect("/dashboard/devices/request");
}
