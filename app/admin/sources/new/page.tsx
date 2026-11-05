import { ConfigForm } from "@/components/admin/config-form";
import { sourceFields } from "@/components/admin/fields";
import { saveSourceAction } from "@/features/admin/actions";

export default function Page() {
  return (
    <>
      <h2 style={{ marginBottom: 16 }}>Register a source</h2>
      <ConfigForm
        action={saveSourceAction.bind(null, "")}
        fields={sourceFields()}
        values={{
          permission: "UNKNOWN",
          commercialUse: "UNKNOWN",
          redistribution: "UNKNOWN",
          reliability: "UNRATED",
          reviewStatus: "UNREVIEWED",
        }}
        submit="Register source"
      />
    </>
  );
}
