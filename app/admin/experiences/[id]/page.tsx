import { notFound } from "next/navigation";
import { ConfigForm } from "@/components/admin/config-form";
import { experienceDefaults, experienceFields } from "@/components/admin/fields";
import { Flash, Revisions, StatusPanel, first } from "@/components/admin/ui";
import { saveExperienceAction } from "@/features/admin/actions";
import { requireAdmin } from "@/lib/auth/admin";
import { getEntity, revisionsFor } from "@/lib/content/service";
import type { Experience } from "@/lib/content/types";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { actor } = await requireAdmin(),
    { id } = await params,
    sp = await searchParams;
  const e = getEntity(actor, "experience", id) as Experience | null;
  if (!e) notFound();
  return (
    <>
      <Flash sp={{ ok: first(sp.ok), error: first(sp.error) }} />
      <h2 style={{ marginBottom: 16 }}>Edit interview experience</h2>
      <StatusPanel
        kind="experience"
        id={id}
        publication={e.publication}
        back={`/admin/experiences/${id}`}
        previewHref={`/interview-experiences/${e.slug}?preview=1`}
      />
      <ConfigForm action={saveExperienceAction.bind(null, id)} fields={experienceFields()} values={experienceDefaults(e)} />
      <Revisions rows={revisionsFor("experience", id)} />
    </>
  );
}
