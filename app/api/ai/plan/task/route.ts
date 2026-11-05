import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrent } from "@/lib/auth/session";
import { updatePlanTask } from "@/lib/ai/services/preparation-planner";

const updateTaskSchema = z.object({
  taskId: z.string(),
  status: z.enum(["TODO", "DONE"]),
});

export async function PATCH(req: Request) {
  const { session, record } = await getCurrent();
  if (!session || !record) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = updateTaskSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const task = await updatePlanTask(parsed.data.taskId, parsed.data.status);
    return NextResponse.json({ task });
  } catch (e) {
    if (e instanceof Error && e.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (e instanceof Error && e.message === "Task not found") {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    console.error("Task update failed:", e);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
