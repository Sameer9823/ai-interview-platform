import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guard";
import { DeleteAccountForm } from "@/features/profile/profile-forms";
import { Card } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Security" };
export default async function Page() {
  await requireUser("/settings/security");
  return (
    <>
      <Card style={{ maxWidth: 560 }}>
        <h3>Password</h3>
        <p className="sm mut" style={{ marginTop: 4 }}>
          Changing your password will sign you out everywhere else. It is disabled until email delivery is connected.
        </p>
        <div className="row">
          <Button variant="outline" disabled>
            Change password
          </Button>
        </div>
      </Card>
      <DeleteAccountForm />
    </>
  );
}
