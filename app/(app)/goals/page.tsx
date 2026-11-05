import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guard";
import { GoalsForm } from "@/features/profile/profile-forms";

export const metadata: Metadata = { title: "Preparation Goals" };
export default async function Page() {
  const u = await requireUser("/goals");
  return (
    <>
      <h1>Preparation Goals</h1>
      <p className="mut" style={{ margin: "8px 0 24px" }}>
        Goals shape the next steps we suggest. Change them any time.
      </p>
      <GoalsForm goals={u.goals} />
    </>
  );
}
