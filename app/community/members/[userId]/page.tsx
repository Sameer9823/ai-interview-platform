import { getCurrent } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import Link from "next/link";
import { Button, Card, Badge, ProgressBar } from "@/components/ui";

interface MemberProfileProps {
  params: Promise<{ userId: string }>;
}

export default async function MemberProfilePage({ params }: MemberProfileProps) {
  const { session } = await getCurrent();
  if (!session) redirect("/sign-in?next=/community/members");

  const { userId } = await params;
  if (userId === session.id) redirect("/profile");

  const isBlocked = await db.userBlock.findUnique({
    where: { blockerId_blockedId: { blockerId: session.id, blockedId: userId } },
  });

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      careerStage: true,
      careerGoals: {
        where: { status: "ACTIVE" },
        select: { targetRole: true, targetCompany: true },
      },
      profile: {
        select: {
          targetRole: true,
          experienceLevel: true,
          educationLevel: true,
          primaryProgrammingLanguage: true,
          skillsToImprove: true,
          currentRole: true,
          yearsOfExperience: true,
        },
      },
      _count: {
        select: {
          groupMemberships: true,
          achievements: { where: { status: { in: ["UNLOCKED", "CLAIMED"] } } },
        },
      },
    },
  });

  if (!user) {
    return <div style={{ padding: "48px", textAlign: "center" }}>User not found</div>;
  }

  const isFollowing = await db.userFollow.findUnique({
    where: { followerId_followingId: { followerId: session.id, followingId: userId } },
  });

  const groups = await db.studyGroupMembership.findMany({
    where: { userId },
    include: { group: { select: { id: true, name: true, visibility: true, memberCount: true } } },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <Link href="/community/members">
          <Button variant="outline" size="small">← All Members</Button>
        </Link>
        <form action={async () => {
          "use server";
          const { db } = await import("@/lib/db/client");
          if (isFollowing) {
            await db.userFollow.deleteMany({ where: { followerId: session.id, followingId: userId } });
          } else {
            await db.userFollow.upsert({
              where: { followerId_followingId: { followerId: session.id, followingId: userId } },
              create: { followerId: session.id, followingId: userId },
              update: {},
            });
          }
        }} method="post">
          <Button type="submit" variant={isFollowing ? "outline" : "solid"} size="small">
            {isFollowing ? "Following" : "Follow"}
          </Button>
        </form>
      </div>

      <Card style={{ padding: 32, marginBottom: 24, textAlign: "center" }}>
        <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--color-brand-bg)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>
          {user.name.charAt(0)}
        </div>
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>{user.name}</h1>
        {user.careerStage && <Badge style={{ marginTop: 8 }}>{user.careerStage}</Badge>}

        {user.profile?.targetRole && (
          <p className="mut" style={{ marginTop: 8 }}>Target: {user.profile.targetRole}</p>
        )}
        {user.profile?.currentRole && (
          <p className="mut">Current: {user.profile.currentRole}</p>
        )}
        {user.profile?.skillsToImprove && user.profile.skillsToImprove.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginTop: 12 }}>
            {user.profile.skillsToImprove.map((s) => (
              <Badge key={s} className="mut">{s}</Badge>
            ))}
          </div>
        )}
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        <Card style={{ padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{user._count.groupMemberships}</div>
          <span className="mut">Study Groups</span>
        </Card>
        <Card style={{ padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{user._count.achievements}</div>
          <span className="mut">Achievements</span>
        </Card>
      </div>

      <Card style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 16 }}>Study Groups</h2>
        {groups.length === 0 ? (
          <p className="mut">Not a member of any study groups.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {groups.map((g) => (
              <div key={g.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>
                <div>
                  <Link href={`/study-groups/${g.group.id}`}>
                    <span style={{ fontWeight: 600, textDecoration: "none", color: "inherit" }}>{g.group.name}</span>
                  </Link>
                  <p className="mut" style={{ margin: 0, fontSize: "0.85rem" }}>{g.group.visibility} • {g.group.memberCount} members</p>
                </div>
                <Badge>{g.role}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
