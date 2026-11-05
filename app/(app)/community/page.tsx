import { getCurrent } from "@/lib/auth/session";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CommunityFeed } from "@/components/community/community-feed";
import { CommunitySidebar } from "@/components/community/community-sidebar";

export default async function CommunityPage() {
  const { session } = await getCurrent();
  if (!session) redirect("/sign-in?next=/community");

  return (
    <div style={{ display: "flex", gap: 24, maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
      <CommunitySidebar />
      <main style={{ flex: 1 }}>
        <CommunityFeed userId={session.id} />
      </main>
    </div>
  );
}
