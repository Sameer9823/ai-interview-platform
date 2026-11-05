import { ConfigForm } from "@/components/admin/config-form";
import { categoryFields, tagFields } from "@/components/admin/fields";
import { Table } from "@/components/admin/ui";
import { createCategoryAction, createTagAction } from "@/features/admin/actions";
import { requireAdmin } from "@/lib/auth/admin";
import { categoryOptions } from "@/lib/content/search";
import { db } from "@/lib/content/store";

export default async function Page() {
  await requireAdmin();
  const tags = [...db().tags.values()].sort((a, b) => a.slug.localeCompare(b.slug));
  const count = (slug: string) => {
    const id = [...db().categories.values()].find((c) => c.slug === slug)!.id;
    return [...db().questions.values()].filter((q) => q.categoryId === id).length;
  };
  return (
    <>
      <p className="sm mut" style={{ marginBottom: 16 }}>
        New categories appear in the question bank immediately. No code change is needed.
      </p>
      <div className="cols2">
        <div>
          <h2 style={{ marginBottom: 12 }}>Add a category</h2>
          <ConfigForm action={createCategoryAction} fields={categoryFields()} submit="Add category" />
        </div>
        <div>
          <h2 style={{ marginBottom: 12 }}>Add a tag</h2>
          <ConfigForm action={createTagAction} fields={tagFields()} submit="Add tag" />
        </div>
      </div>
      <section className="sect">
        <h2>Categories</h2>
        <div style={{ marginTop: 12 }}>
          <Table caption="Category tree with direct question counts" head={["Category", "Slug", "Questions"]}>
            {categoryOptions().map((c) => (
              <tr key={c.slug}>
                <td>{c.label}</td>
                <td>{c.slug}</td>
                <td>{count(c.slug)}</td>
              </tr>
            ))}
          </Table>
        </div>
      </section>
      <section className="sect">
        <h2>Tags ({tags.length})</h2>
        <p className="sm" style={{ marginTop: 12 }}>
          {tags.map((t) => t.slug).join(", ") || "None yet."}
        </p>
      </section>
    </>
  );
}
