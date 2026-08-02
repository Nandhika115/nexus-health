import Shell from "@/components/Shell";
import PrivacyClient from "@/components/PrivacyClient";
import { getProfile, getConsentShares } from "@/lib/data";

const FALLBACK_SHARES = [
  { id: "1", scope: "Blood report", expires_at: new Date(Date.now() + 7 * 86400000).toISOString(), doctor: { full_name: "Dr. Priya Raman" } },
  { id: "2", scope: "Full medical history", expires_at: new Date(Date.now() + 2 * 86400000).toISOString(), doctor: { full_name: "Dr. Kumar S." } },
];

export default async function PrivacyPage() {
  const profile = await getProfile();
  const rows = profile ? await getConsentShares(profile.id) : [];
  const shares = rows.length > 0 ? (rows as any) : FALLBACK_SHARES;

  return (
    <Shell eyebrow="You're in control" title="Privacy Center 🔐">
      <PrivacyClient
        patientId={profile?.id ?? null}
        initialMemoryEnabled={profile?.memory_enabled ?? true}
        initialShares={shares}
        isDemoData={rows.length === 0}
      />
    </Shell>
  );
}
