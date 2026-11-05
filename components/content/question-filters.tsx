import Link from "next/link";
import { SelectField, TextField } from "@/components/ui/field";
import { categoryOptions, publishedCompanyOptions } from "@/lib/content/search";
import { LABELS } from "@/lib/content/types";
import type { QuestionQuery } from "@/lib/content/validation";

const opts = (o: Record<string, string>) => o;
export function QuestionFilters({ q, action = "/questions", lockCategory }: { q: QuestionQuery; action?: string; lockCategory?: boolean }) {
  return (
    <form method="get" action={action} className="filters" role="search" aria-label="Filter questions">
      <TextField id="q" label="Search" type="search" defaultValue={q.q} maxLength={200} />
      {!lockCategory && (
        <div className="field">
          <label htmlFor="category">Category</label>
          <select id="category" name="category" defaultValue={q.category ?? ""}>
            <option value="">All categories</option>
            {categoryOptions().map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <SelectField id="difficulty" label="Difficulty" options={opts(LABELS.difficulty)} defaultValue={q.difficulty ?? ""} />
      <SelectField id="type" label="Question type" options={opts(LABELS.questionType)} defaultValue={q.type ?? ""} />
      <div className="field">
        <label htmlFor="company">Company</label>
        <select id="company" name="company" defaultValue={q.company ?? ""}>
          <option value="">Any company</option>
          {publishedCompanyOptions().map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <TextField id="role" label="Role" defaultValue={q.role ?? ""} maxLength={80} />
      <SelectField id="stage" label="Career stage" options={opts(LABELS.careerStage)} defaultValue={q.stage ?? ""} />
      <SelectField id="level" label="Experience level" options={opts(LABELS.level)} defaultValue={q.level ?? ""} />
      <TextField id="skill" label="Skill" defaultValue={q.skill ?? ""} maxLength={60} />
      <SelectField id="origin" label="Content source type" options={opts(LABELS.origin)} defaultValue={q.origin ?? ""} />
      <SelectField id="verification" label="Verification" options={opts(LABELS.verification)} defaultValue={q.verification ?? ""} />
      <div className="field">
        <label htmlFor="sort">Sort by</label>
        <select id="sort" name="sort" defaultValue={q.sort}>
          <option value="relevance">Relevance</option>
          <option value="newest">Newest</option>
          <option value="difficulty">Difficulty</option>
          <option value="time">Preparation time</option>
        </select>
      </div>
      <div className="row">
        <button className="btn" type="submit">
          Apply
        </button>
        <Link className="btn o" href={action}>
          Clear
        </Link>
      </div>
    </form>
  );
}
export const filterParams = (q: QuestionQuery) => ({
  q: q.q,
  category: q.category,
  difficulty: q.difficulty,
  type: q.type,
  company: q.company,
  role: q.role,
  stage: q.stage,
  level: q.level,
  skill: q.skill,
  origin: q.origin,
  verification: q.verification,
  sort: q.sort === "relevance" ? undefined : q.sort,
});
