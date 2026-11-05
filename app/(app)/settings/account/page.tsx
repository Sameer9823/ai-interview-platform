import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guard";
import { signOutAction } from "@/features/auth/actions";
import { Card } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { CAREER_STAGE_LABELS } from "@/lib/utils/labels";

export const metadata: Metadata = { title: "Account settings" };
export default async function Page() {
  const u = await requireUser("/settings/account");
  return (
    <Card style={{ maxWidth: 560 }}>
      <ul className="l">
        <li>
          <span className="mut">Name</span>
          <span>{u.name}</span>
        </li>
        <li>
          <span className="mut">Email</span>
          <span>{u.email}</span>
        </li>
        <li>
          <span className="mut">Career stage</span>
          <span>{CAREER_STAGE_LABELS[u.careerStage!]}</span>
        </li>
      </ul>
      <p className="sm mut" style={{ marginTop: 16 }}>
        Your name is edited in My Profile. Your career stage is fixed after onboarding.
      </p>
      <form action={signOutAction} className="row">
        <Button variant="outline" type="submit">
          Sign out
        </Button>
      </form>
    </Card>
  );
}
