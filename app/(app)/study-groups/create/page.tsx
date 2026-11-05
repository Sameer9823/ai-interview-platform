import { getCurrent } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import Link from "next/link";
import { Button, Card, Input, Textarea, Select, Badge, EmptyState } from "@/components/ui";

export default async function CreateGroupPage() {
  const { session } = await getCurrent();
  if (!session) redirect("/sign-in?next=/study-groups/create");

  const categories = [
    "DSA", "Programming", "System Design", "Behavioral", "HR",
    "Aptitude", "Verbal", "Career Guidance", "Coding", "Mock Interview",
  ];

  const careerStages = [
    { value: "STUDENT", label: "Student" },
    { value: "FRESHER", label: "Fresher" },
    { value: "PROFESSIONAL", label: "Professional" },
  ];

  async function createGroup(formData: FormData) {
    "use server";
    const { session: authSession } = await getCurrent();
    if (!authSession) redirect("/sign-in");

    const name = formData.get("name")?.toString().trim();
    const description = formData.get("description")?.toString().trim();
    const category = formData.get("category")?.toString();
    const skill = formData.get("skill")?.toString().trim() || undefined;
    const careerStage = formData.get("careerStage")?.toString() || undefined;
    const visibility = formData.get("visibility")?.toString() || "PUBLIC";
    const maxMembers = parseInt(formData.get("maxMembers")?.toString() || "50", 10);
    const rules = formData.get("rules")?.toString();

    if (!name || name.length < 3) {
      throw new Error("Name must be at least 3 characters");
    }
    if (!description || description.length < 10) {
      throw new Error("Description must be at least 10 characters");
    }

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}-${Math.random().toString(36).substring(2, 8)}`;

    const group = await db.studyGroup.create({
      data: {
        name,
        slug,
        description,
        category: category || "General",
        skill,
        careerStage: careerStage as any,
        maxMembers,
        visibility: visibility as any,
        rules: rules ? JSON.stringify(rules.split("\n").map((r) => r.trim()).filter(Boolean)) : undefined,
        imageUrl: formData.get("imageUrl")?.toString() || undefined,
      },
    });

    await db.studyGroupMembership.create({
      data: { groupId: group.id, userId: authSession.id, role: "OWNER" },
    });

    await db.studyGroup.update({
      where: { id: group.id },
      data: { memberCount: { increment: 1 } },
    });

    redirect(`/study-groups/${group.id}`);
  }

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "24px" }}>
      <Link href="/study-groups">
        <Button variant="outline" size="small" style={{ marginBottom: 16 }}>← Back to Study Groups</Button>
      </Link>
      <h1>Create Study Group</h1>
      <form action={createGroup} style={{ display: "grid", gap: 16, marginTop: 24 }}>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Group Name *</label>
          <Input name="name" placeholder="e.g., JavaScript Interview Preparation" required maxLength={100} />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Description *</label>
          <Textarea name="description" placeholder="Brief description of the group's purpose" required maxLength={500} rows={4} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Category</label>
            <select name="category" style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--color-border)", borderRadius: "6px" }}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Skill / Subject</label>
            <Input name="skill" placeholder="e.g., React, System Design" />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Career Stage</label>
            <Select name="careerStage" options={[{ value: "", label: "Any" }, ...careerStages]} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Visibility</label>
            <select name="visibility" style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--color-border)", borderRadius: "6px" }}>
              <option value="PUBLIC">Public (anyone can join)</option>
              <option value="PRIVATE">Private (invite only)</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Max Members</label>
            <Input type="number" name="maxMembers" defaultValue={50} min={2} max={1000} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Group Image URL</label>
            <Input name="imageUrl" placeholder="https://example.com/image.jpg" />
          </div>
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Group Rules</label>
          <Textarea name="rules" placeholder="One rule per line&#10;Be respectful&#10;No spam&#10;Stay on topic" rows={3} />
          <p className="mut" style={{ marginTop: 4, fontSize: "0.85rem" }}>One rule per line. Visible to members.</p>
        </div>
        <Button type="submit" variant="solid">Create Group</Button>
      </form>
    </div>
  );
}
