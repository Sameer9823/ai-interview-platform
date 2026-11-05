import { getCurrent } from "@/lib/auth/session";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import Link from "next/link";
import { Button, Card, Badge, EmptyState, ProgressBar } from "@/components/ui";
import { GroupOverview } from "@/components/community/group-overview";

export default async function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { session } = await getCurrent();
  if (!session) redirect("/sign-in?next=/study-groups");

  const { groupId } = await params;

  const group = await db.studyGroup.findUnique({
    where: { id: groupId },
    include: {
      memberships: {
        where: { userId: session.id },
        select: { role: true },
      },
      _count: {
        select: {
          memberships: true,
          discussions: true,
          resources: true,
          sessions: true,
          challenges: true,
        },
      },
    },
  });

  if (!group) notFound();

  const userRole = group.memberships[0]?.role ?? null;

  if (!userRole && group.visibility !== "PUBLIC") {
    notFound();
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
       <GroupOverview
          group={group as any}
          userRole={userRole as any}
          counts={group._count}
          userId={session.id}
        />
    </div>
  );
}
