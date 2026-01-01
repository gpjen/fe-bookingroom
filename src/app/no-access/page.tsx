import { getSystemSettings } from "@/app/(protected)/admin/settings/_actions/settings.actions";
import { NoAccessView } from "./_components/no-access-view";

export default async function NoAccessPage() {
  // Fetch system settings to get dynamic support links (Whatsapp/Helpdesk)
  const result = await getSystemSettings();
  const settings = result.success ? result.data : undefined;

  return <NoAccessView settings={settings} />;
}
