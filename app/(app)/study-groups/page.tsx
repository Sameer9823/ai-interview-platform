import { getCurrent } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import Link from "next/link";
import { Button, Card, ProgressBar } from "@/components/ui";

export default async function StudyGroupsPage() {
  const { session } = await getCurrent();
  if (!session) redirect("/sign-in?next=/study-groups");

  const url = new URLSearchParams();

  return (
    <StudyGroupsClient userId={session.id} />
  );
}

function StudyGroupsClient({ userId }: { userId: string }) {
  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px" }}>
      <StudyGroupsList userId={userId} />
    </div>
  );
}

async function StudyGroupsList({ userId }: { userId: string }) {
  const groups = await db.studyGroup.findMany({
    where: {
      visibility: "PUBLIC",
      memberCount: { gt: 0 },
    },
    orderBy: { memberCount: "desc" },
    include: {
      memberships: {
        where: { userId },
        select: { role: true },
      },
    },
  });

  const myGroups = groups.filter((g) => g.memberships.length > 0);
  const publicGroups = groups.filter((g) => g.memberships.length === 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1>Study Groups</h1>
        <Link href="/study-groups/create">
          <Button variant="solid">Create Group</Button>
        </Link>
      </div>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: 12 }}>Your Groups ({myGroups.length})</h2>
        {myGroups.length === 0 ? (
          <p className="mut">You haven't joined any study groups yet.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {myGroups.map((g) => (
              <GroupCard key={g.id} group={g} userId={userId} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: "1.1rem", marginBottom: 12 }}>Discover Public Groups ({publicGroups.length})</h2>
        {publicGroups.length === 0 ? (
          <p className="mut">No public groups found. Be the first to create one!</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {publicGroups.map((g) => (
              <GroupCard key={g.id} group={g} userId={userId} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function GroupCard({ group, userId }: { group: any; userId: string }) {
  const userRole = group.memberships.length > 0 ? group.memberships[0].role : null;
  const roleColor = userRole === "OWNER" ? "var(--color-warning)" : userRole === "ADMIN" ? "var(--color-info)" : userRole === "MODERATOR" ? "var(--color-success)" : "var(--color-text-muted)";

  return (
    <Card style={{ padding: 16, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <Link href={`/study-groups/${group.id}`}>
            <h3 style={{ margin: "0 0 4px", fontWeight: 600, textDecoration: "none", color: "inherit" }}>{group.name}</h3>
          </Link>
          <p className="mut" style={{ fontSize: "0.85rem", margin: 0 }}>{group.description.substring(0, 120)}...</p>
        </div>
        {userRole && <span style={{ fontSize: "0.8rem", padding: "2px 8px", borderRadius: "12px", background: roleColor, color: "white" }}>{userRole}</span>}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "8px 0" }}>
        <span className="mut" style={{ fontSize: "0.8rem" }}>{group.category}</span>
        {group.skill && <span className="mut" style={{ fontSize: "0.8rem" }}>{group.skill}</span>}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: 8, borderTop: "1px solid var(--color-border)" }}>
        <span className="mut" style={{ fontSize: "0.85rem" }}>{group.memberCount} members</span>
        {userRole ? (
          <Link href={`/study-groups/${group.id}`}>
            <Button variant="outline" size="small">Enter Group</Button>
          </Link>
        ) : (
          <form action={async (formData: FormData) => {
            "use server";
            const { joinGroup } = await import("@/lib/community/study-groups");
            await joinGroup(userId, group.id);
          }} method="post">
            <Button type="submit" variant="solid" size="small">Join</Button>
          </form>
        )}
      </div>
    </Card>
  );
}
