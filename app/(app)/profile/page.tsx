import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guard";
import { ProfileForm } from "@/features/profile/profile-forms";

export const metadata: Metadata = { title: "My Profile" };
export default async function Page() {
  const u = await requireUser("/profile");
  return (
    <>
      <h1>My Profile</h1>
      <p className="mut" style={{ margin: "8px 0 24px" }}>
        Your career stage is fixed after onboarding. Everything else can be updated.
      </p>
      <ProfileForm professional={u.careerStage === "PROFESSIONAL"} name={u.name} profile={u.profile} />
    </>
  );
}
