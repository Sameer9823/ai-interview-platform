import { getCurrent } from "@/lib/auth/session";
import { errorReportCsv } from "@/lib/content/import/pipeline";
import { db } from "@/lib/content/store";

export const dynamic = "force-dynamic";

/** Admin only. Anyone else gets a plain 404 so the route does not reveal itself. */
export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { record } = await getCurrent();
  if (!record || record.platformRole !== "ADMIN") return new Response("Not found", { status: 404 });
  const job = db().imports.get((await ctx.params).id);
  if (!job) return new Response("Not found", { status: 404 });
  return new Response(errorReportCsv(job), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="import-${job.id.slice(0, 8)}-errors.csv"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
