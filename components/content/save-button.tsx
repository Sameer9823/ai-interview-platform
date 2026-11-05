import { toggleSavedAction } from "@/features/saved/actions";

export function SaveButton({ questionId, saved, back }: { questionId: string; saved: boolean; back: string }) {
  return (
    <form action={toggleSavedAction}>
      <input type="hidden" name="questionId" value={questionId} />
      <input type="hidden" name="back" value={back} />
      <button className="btn o" type="submit" aria-pressed={saved}>
        {saved ? "Saved. Remove from saved" : "Save question"}
      </button>
    </form>
  );
}
