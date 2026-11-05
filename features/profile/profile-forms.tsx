"use client";
import { useActionState } from "react";
import { updateProfileAction, updateGoalsAction, updatePreferencesAction, deleteAccountAction } from "./actions";
import { Button } from "@/components/ui/button";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { SelectField, TextField } from "@/components/ui/field";
import { Card } from "@/components/ui/misc";
import { DOMAIN_SUGGESTIONS, EDUCATION_LABELS, EXPERIENCE_LEVEL_LABELS, GOAL_LABELS } from "@/lib/utils/labels";
import type { Profile } from "@/lib/data/dev-store";
import type { FormState } from "@/lib/utils/form";

const init: FormState = {};
const Status = ({ s }: { s: FormState }) =>
  s.ok ? (
    <p className="ok" role="status">
      {s.message}
    </p>
  ) : null;
const d = (v: unknown) => (v === undefined ? "" : String(v));

export function ProfileForm({ professional, name, profile }: { professional: boolean; name: string; profile: Profile }) {
  const [s, action, pending] = useActionState(updateProfileAction, init);
  const e = s.errors ?? {};
  return (
    <Card style={{ maxWidth: 560 }}>
      <form action={action} noValidate>
        <TextField id="name" label="Full name" defaultValue={name} error={e.name} />
        <TextField
          id="careerDomain"
          label="Preferred career domain"
          list="domains"
          defaultValue={d(profile.careerDomain)}
          error={e.careerDomain}
        />
        <datalist id="domains">
          {DOMAIN_SUGGESTIONS.map((x) => (
            <option key={x} value={x} />
          ))}
        </datalist>
        <TextField
          id="targetRole"
          label={professional ? "Target role or career transition" : "Target role"}
          defaultValue={d(profile.targetRole)}
          error={e.targetRole}
        />
        <SelectField
          id="experienceLevel"
          label="Self assessed experience level"
          options={EXPERIENCE_LEVEL_LABELS}
          defaultValue={d(profile.experienceLevel)}
          error={e.experienceLevel}
        />
        {professional ? (
          <>
            <TextField id="currentRole" label="Current role" defaultValue={d(profile.currentRole)} error={e.currentRole} />
            <TextField
              id="yearsOfExperience"
              label="Years of experience"
              type="number"
              min={0}
              max={60}
              defaultValue={d(profile.yearsOfExperience)}
              error={e.yearsOfExperience}
            />
            <TextField
              id="skillsToImprove"
              label="Skills to improve"
              hint="Separate with commas, up to 10."
              defaultValue={profile.skillsToImprove.join(", ")}
              error={e.skillsToImprove}
            />
          </>
        ) : (
          <>
            <SelectField
              id="educationLevel"
              label="Education level"
              options={EDUCATION_LABELS}
              defaultValue={d(profile.educationLevel)}
              error={e.educationLevel}
            />
            <TextField id="degree" label="Degree or specialization" defaultValue={d(profile.degree)} error={e.degree} />
            <TextField
              id="graduationYear"
              label="Graduation year"
              type="number"
              defaultValue={d(profile.graduationYear)}
              error={e.graduationYear}
            />
            <TextField
              id="primaryProgrammingLanguage"
              label="Primary programming language"
              defaultValue={d(profile.primaryProgrammingLanguage)}
              error={e.primaryProgrammingLanguage}
            />
          </>
        )}
        <div className="field">
          <label htmlFor="lang">Preparation language</label>
          <select id="lang" disabled defaultValue="en">
            <option value="en">English</option>
          </select>
        </div>
        <div className="row">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving" : "Save changes"}
          </Button>
        </div>
        <Status s={s} />
      </form>
    </Card>
  );
}

export function GoalsForm({ goals }: { goals: string[] }) {
  const [s, action, pending] = useActionState(updateGoalsAction, init);
  return (
    <Card style={{ maxWidth: 560 }}>
      <form action={action}>
        <ChoiceGroup
          legend="What do you want to prepare for? Pick any that apply."
          name="goals"
          type="checkbox"
          defaultValue={goals}
          error={s.errors?.goals}
          options={Object.entries(GOAL_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <div className="row">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving" : "Save goals"}
          </Button>
        </div>
        <Status s={s} />
      </form>
    </Card>
  );
}

export function PreferencesForm({ prefs }: { prefs: { theme: string; emailNotifications: boolean; productUpdates: boolean } }) {
  const [s, action, pending] = useActionState(updatePreferencesAction, init);
  return (
    <Card style={{ maxWidth: 560 }}>
      <form action={action}>
        <div className="sw">
          <label htmlFor="emailNotifications" style={{ margin: 0 }}>
            Email notifications<div className="hint">Account and security messages.</div>
          </label>
          <input id="emailNotifications" name="emailNotifications" type="checkbox" defaultChecked={prefs.emailNotifications} />
        </div>
        <div className="sw">
          <label htmlFor="productUpdates" style={{ margin: 0 }}>
            Product updates<div className="hint">News about new tools.</div>
          </label>
          <input id="productUpdates" name="productUpdates" type="checkbox" defaultChecked={prefs.productUpdates} />
        </div>
        <SelectField
          id="theme"
          label="Theme"
          options={{ DARK: "Dark", LIGHT: "Light" }}
          defaultValue={prefs.theme}
          error={s.errors?.theme}
        />
        <div className="row">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving" : "Save preferences"}
          </Button>
        </div>
        <Status s={s} />
      </form>
    </Card>
  );
}

export function DeleteAccountForm() {
  const [s, action, pending] = useActionState(deleteAccountAction, init);
  const e = s.errors ?? {};
  return (
    <Card style={{ maxWidth: 560, marginTop: 16, borderColor: "var(--err)" }}>
      <h3>Delete account</h3>
      <p className="sm mut" style={{ marginTop: 4 }}>
        Removes your profile, goals, preferences and activity. This cannot be undone.
      </p>
      <form action={action} noValidate>
        <TextField id="password" label="Password" type="password" autoComplete="current-password" error={e.password} />
        <TextField id="confirmation" label="Type DELETE to confirm" autoComplete="off" error={e.confirmation} />
        <div className="row">
          <Button type="submit" variant="danger" disabled={pending}>
            {pending ? "Deleting" : "Delete account"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
