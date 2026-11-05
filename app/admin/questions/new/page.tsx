import { ConfigForm } from "@/components/admin/config-form";
import { questionFields } from "@/components/admin/fields";
import { saveQuestionAction } from "@/features/admin/actions";

export default function Page() {
  return (
    <>
      <h2 style={{ marginBottom: 16 }}>New question</h2>
      <ConfigForm
        action={saveQuestionAction.bind(null, "")}
        fields={questionFields()}
        values={{ origin: "ADMIN_CURATED", verification: "NOT_VERIFIED", estimatedMinutes: "5" }}
        submit="Create draft"
      />
    </>
  );
}
