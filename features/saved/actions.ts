"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrent } from "@/lib/auth/session";
import { toggleSaved } from "@/lib/content/search";
import { safeRedirect } from "@/lib/utils/safe-redirect";

/** The user id comes from the signed session. A crafted request cannot save on someone else's behalf. */
export async function toggleSavedAction(fd: FormData) {
  const back = safeRedirect(fd.get("back"), "/questions");
  const { record } = await getCurrent();
  if (!record) redirect(`/sign-in?next=${encodeURIComponent(back)}`);
  const id = fd.get("questionId");
  if (typeof id === "string") {
    try {
      toggleSaved(record.id, id);
    } catch {
      /* unpublished or unknown: ignore */
    }
  }
  revalidatePath(back);
  redirect(back);
}
