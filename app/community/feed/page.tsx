import { getCurrent } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { CommunityFeed } from "@/components/community/community-feed";
import { CommunitySidebar } from "@/components/community/community-sidebar";

export default async function FeedPage() {
  const { session } = await getCurrent();
  if (!session) redirect("/sign-in?next=/community/feed");

  return (
    <div style={{ display: "flex", gap: 24, maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
      <CommunitySidebar />
      <main style={{ flex: 1 }}>
        <CommunityFeed userId={session.id} />
      </main>
    </div>
  );
}
