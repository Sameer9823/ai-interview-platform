import { ConfigForm } from "@/components/admin/config-form";
import { companyFields } from "@/components/admin/fields";
import { saveCompanyAction } from "@/features/admin/actions";

export default function Page() {
  return (
    <>
      <h2 style={{ marginBottom: 16 }}>New company</h2>
      <ConfigForm
        action={saveCompanyAction.bind(null, "")}
        fields={companyFields()}
        values={{ origin: "ADMIN_CURATED", verification: "NOT_VERIFIED" }}
        submit="Create draft"
      />
    </>
  );
}
