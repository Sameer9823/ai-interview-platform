"use server";
import { revalidatePath } from "next/cache";
import { getCurrent } from "@/lib/auth/session";
import { db } from "@/lib/db/client";

export async function markNotificationsReadAction() {
  const { record } = await getCurrent();
  if (!record) return;
  
  await db.notification.updateMany({
    where: { userId: record.id, readAt: null },
    data: { readAt: new Date() },
  });
  
  revalidatePath("/", "layout");
}
