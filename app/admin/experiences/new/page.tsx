import { ConfigForm } from "@/components/admin/config-form";
import { experienceFields } from "@/components/admin/fields";
import { saveExperienceAction } from "@/features/admin/actions";

export default function Page() {
  return (
    <>
      <h2 style={{ marginBottom: 16 }}>New interview experience</h2>
      <p className="banner">
        Summarise in your own words. Do not copy restricted or confidential material, and leave out names and personal details. Keep the
        original source reference.
      </p>
      <ConfigForm
        action={saveExperienceAction.bind(null, "")}
        fields={experienceFields()}
        values={{ origin: "CANDIDATE_REPORTED", verification: "NOT_VERIFIED" }}
        submit="Create draft"
      />
    </>
  );
}
