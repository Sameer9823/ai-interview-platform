import { ConfigForm } from "@/components/admin/config-form";
import { processFields } from "@/components/admin/fields";
import { saveProcessAction } from "@/features/admin/actions";

export default async function Page({ searchParams }: { searchParams: Promise<{ company?: string }> }) {
  const { company } = await searchParams;
  return (
    <>
      <h2 style={{ marginBottom: 16 }}>New interview round</h2>
      <ConfigForm
        action={saveProcessAction.bind(null, "")}
        fields={processFields()}
        values={{ companyId: company ?? "", origin: "ADMIN_CURATED", verification: "NOT_VERIFIED" }}
        submit="Create draft"
      />
    </>
  );
}
