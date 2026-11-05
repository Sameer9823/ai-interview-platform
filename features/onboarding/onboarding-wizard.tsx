"use client";
import { useState, useTransition } from "react";
import { completeOnboardingAction } from "./actions";
import { Button } from "@/components/ui/button";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { SelectField, TextField } from "@/components/ui/field";
import { Card, Logo } from "@/components/ui/misc";
import {
  CAREER_STAGE_HINTS,
  CAREER_STAGE_LABELS,
  DOMAIN_SUGGESTIONS,
  EDUCATION_LABELS,
  EXPERIENCE_LEVEL_LABELS,
  GOAL_LABELS,
} from "@/lib/utils/labels";

type Step = 1 | 2 | 3;
const STEP_OF: Record<string, Step> = {
  careerStage: 1,
  careerDomain: 2,
  targetRole: 2,
  experienceLevel: 2,
  educationLevel: 2,
  degree: 2,
  graduationYear: 2,
  primaryProgrammingLanguage: 2,
  currentRole: 2,
  yearsOfExperience: 2,
  skillsToImprove: 2,
  goals: 3,
};
const TITLES: Record<Step, string> = { 1: "Where are you in your career?", 2: "Your career profile", 3: "Your preparation goals" };

export function OnboardingWizard() {
  const [step, setStep] = useState<Step>(1);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [goals, setGoals] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const stage = vals.careerStage;
  const pro = stage === "PROFESSIONAL";
  const field = (k: string) => ({
    value: vals[k] ?? "",
    onChange: (ev: { target: { value: string } }) => setVals((v) => ({ ...v, [k]: ev.target.value })),
    error: errors[k],
  });

  function next() {
    const e: Record<string, string> = {};
    if (step === 1 && !stage) e.careerStage = "Choose your career stage";
    if (step === 2) {
      if (!vals.careerDomain?.trim()) e.careerDomain = "Enter your preferred career domain";
      if (!vals.targetRole?.trim()) e.targetRole = "Enter your target role";
      if (!vals.experienceLevel) e.experienceLevel = "Choose your experience level";
      if (pro && (vals.yearsOfExperience ?? "") === "") e.yearsOfExperience = "Enter your years of experience";
      if (!pro && !vals.educationLevel) e.educationLevel = "Choose your education level";
      if (!pro && !vals.degree?.trim()) e.degree = "Enter your degree or specialization";
    }
    setErrors(e);
    if (!Object.keys(e).length) setStep((s) => (s + 1) as Step);
  }

  function finish(skipGoals: boolean) {
    start(async () => {
      const result = await completeOnboardingAction({ ...vals, goals: skipGoals ? [] : goals });
      if (result?.errors) {
        setErrors(result.errors);
        const first = Object.keys(result.errors)[0];
        setStep((first && STEP_OF[first]) || 2);
      }
    });
  }

  return (
    <div className="center">
      <Card className="auth fade">
        <Logo />
        <p className="sm mut">Step {step} of 3</p>
        <div className="prog" aria-hidden="true">
          <i className="on" />
          <i className={step >= 2 ? "on" : ""} />
          <i className={step === 3 ? "on" : ""} />
        </div>
        <h1 tabIndex={-1}>{TITLES[step]}</h1>

        {step === 1 && (
          <fieldset className="field" style={{ border: 0, padding: 0, margin: "16px 0 0" }}>
            <legend className="sm mut" style={{ padding: 0, marginBottom: 8 }}>
              This sets up the dashboard that fits you.
            </legend>
            <div className="opts" style={{ gridTemplateColumns: "1fr" }}>
              {Object.keys(CAREER_STAGE_LABELS).map((k) => (
                <label className="opt" key={k}>
                  <input
                    type="radio"
                    name="careerStage"
                    value={k}
                    checked={stage === k}
                    onChange={() => setVals((v) => ({ ...v, careerStage: k }))}
                  />
                  <b>{CAREER_STAGE_LABELS[k]}</b>
                  <span>{CAREER_STAGE_HINTS[k]}</span>
                </label>
              ))}
            </div>
            {errors.careerStage && (
              <div className="err" role="alert">
                {errors.careerStage}
              </div>
            )}
          </fieldset>
        )}

        {step === 2 && (
          <>
            <TextField id="careerDomain" label="Preferred career domain" list="domains" {...field("careerDomain")} />
            <datalist id="domains">
              {DOMAIN_SUGGESTIONS.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
            <TextField id="targetRole" label={pro ? "Target role or career transition" : "Target role"} {...field("targetRole")} />
            <SelectField
              id="experienceLevel"
              label="Self assessed experience level"
              options={EXPERIENCE_LEVEL_LABELS}
              {...field("experienceLevel")}
            />
            {pro ? (
              <>
                <TextField id="currentRole" label="Current role" hint="Optional" {...field("currentRole")} />
                <TextField
                  id="yearsOfExperience"
                  label="Years of experience"
                  type="number"
                  min={0}
                  max={60}
                  {...field("yearsOfExperience")}
                />
                <TextField
                  id="skillsToImprove"
                  label="Skills to improve"
                  hint="Optional. Separate with commas, up to 10."
                  {...field("skillsToImprove")}
                />
              </>
            ) : (
              <>
                <SelectField id="educationLevel" label="Education level" options={EDUCATION_LABELS} {...field("educationLevel")} />
                <TextField id="degree" label="Degree or specialization" {...field("degree")} />
                <TextField id="graduationYear" label="Graduation year" type="number" hint="Optional" {...field("graduationYear")} />
                <TextField
                  id="primaryProgrammingLanguage"
                  label="Primary programming language"
                  hint="Optional"
                  {...field("primaryProgrammingLanguage")}
                />
              </>
            )}
            <div className="field">
              <label htmlFor="lang">Preparation language</label>
              <select id="lang" disabled defaultValue="en">
                <option value="en">English</option>
              </select>
              <div className="hint">More languages may come later.</div>
            </div>
          </>
        )}

        {step === 3 && (
          <ChoiceGroup
            legend="What do you want to prepare for? Pick any that apply."
            name="goals"
            type="checkbox"
            defaultValue={goals}
            error={errors.goals}
            onChange={setGoals}
            options={Object.entries(GOAL_LABELS).map(([value, label]) => ({ value, label }))}
          />
        )}

        <div className="row">
          {step > 1 && (
            <Button variant="outline" disabled={pending} onClick={() => setStep((s) => (s - 1) as Step)}>
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={next}>Continue</Button>
          ) : (
            <Button disabled={pending} onClick={() => finish(false)}>
              {pending ? "Saving" : "Finish"}
            </Button>
          )}
          {step === 3 && (
            <Button variant="outline" disabled={pending} onClick={() => finish(true)}>
              Skip for now
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
