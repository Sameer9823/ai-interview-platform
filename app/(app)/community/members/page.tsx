import { getCurrent } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import Link from "next/link";
import { Button, Card, Badge, EmptyState } from "@/components/ui";

interface MembersPageProps {
  searchParams: Promise<{ search?: string; careerStage?: string; limit?: string; cursor?: string }>;
}

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const { session } = await getCurrent();
  if (!session) redirect("/sign-in?next=/community/members");

  const params = await searchParams;
  const search = params.search || "";
  const careerStage = params.careerStage;
  const limit = parseInt(params.limit || "20", 10);
  const cursor = params.cursor;

  let where: any = {
    id: { not: session.id },
  };

  const blocked = await db.userBlock.findMany({
    where: { blockerId: session.id },
    select: { blockedId: true },
  });
  const blockedIds = blocked.map((b) => b.blockedId);
  where.id = { notIn: [...blockedIds, session.id] };

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }
  if (careerStage) {
    where.careerStage = careerStage;
  }

  const cursorCondition: any = {};
  if (cursor) {
    const cursorUser = await db.user.findUnique({
      where: { id: cursor },
      select: { createdAt: true },
    });
    if (cursorUser) {
      cursorCondition.createdAt = { lt: cursorUser.createdAt };
    }
  }

  const users = await db.user.findMany({
    where: { ...where, ...cursorCondition },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    select: {
      id: true,
      name: true,
      careerStage: true,
      profile: {
        select: {
          targetRole: true,
          experienceLevel: true,
          primaryProgrammingLanguage: true,
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

  let hasNextPage = false;
  if (users.length > limit) {
    hasNextPage = true;
    users.pop();
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1>Community Members</h1>
        <Link href="/community">
          <Button variant="outline" size="small">Back to Community</Button>
        </Link>
      </div>

      <form method="get" style={{ marginBottom: 24, display: "flex", gap: 12 }}>
        <input
          type="text"
          name="search"
          placeholder="Search members..."
          defaultValue={search}
          style={{ flex: 1, padding: "8px 12px", border: "1px solid var(--color-border)", borderRadius: "6px" }}
        />
        <select name="careerStage" defaultValue={careerStage || ""} style={{ padding: "8px 12px", border: "1px solid var(--color-border)", borderRadius: "6px" }}>
          <option value="">All stages</option>
          <option value="STUDENT">Student</option>
          <option value="FRESHER">Fresher</option>
          <option value="PROFESSIONAL">Professional</option>
        </select>
        <Button type="submit" variant="solid" size="small">Search</Button>
      </form>

      {users.length === 0 ? (
        <EmptyState>
          <h3>No members found</h3>
          <p>Try adjusting your search filters.</p>
        </EmptyState>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {users.map((user) => (
            <Card key={user.id} style={{ padding: 16 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--color-brand-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }}>
                  {user.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <Link href={`/community/members/${user.id}`}>
                    <h3 style={{ margin: 0, fontWeight: 600, textDecoration: "none", color: "inherit" }}>{user.name}</h3>
                  </Link>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {user.careerStage && <Badge>{user.careerStage}</Badge>}
                    {user.profile?.targetRole && <Badge>{user.profile.targetRole}</Badge>}
                  </div>
                  <div className="mut" style={{ fontSize: "0.85rem", marginTop: 4 }}>
                    {user._count.groupMemberships} groups • {user._count.achievements} achievements
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {hasNextPage && (
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <Link href={`/community/members?${new URLSearchParams({ ...(search && { search }), ...(careerStage && { careerStage }), cursor: users[users.length - 1]?.id || "" }).toString()}`}>
            <Button variant="outline">Load More</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
