"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/misc";
import type { FormState } from "@/lib/utils/form";

export interface Field {
  name: string;
  label: string;
  kind: "text" | "textarea" | "select" | "multi" | "number";
  options?: { value: string; label: string }[];
  hint?: string;
  rows?: number;
}
type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

/** Renders an admin form from a field list. Errors come back per field. Values are kept when validation fails. */
export function ConfigForm({
  action,
  fields,
  values = {},
  submit = "Save",
}: {
  action: Action;
  fields: Field[];
  values?: Record<string, string | string[]>;
  submit?: string;
}) {
  const [state, run, pending] = useActionState(action, {});
  const e = state.errors ?? {},
    echoed = state.values ?? {};
  const val = (n: string) => echoed[n] ?? values[n] ?? "";
  const list = (n: string) =>
    echoed[n] !== undefined
      ? String(echoed[n]).split(",")
      : Array.isArray(values[n])
        ? (values[n] as string[])
        : values[n]
          ? [String(values[n])]
          : [];
  return (
    <Card style={{ maxWidth: 720 }}>
      <form action={run} noValidate>
        {state.formError && (
          <div className="err" role="alert">
            {state.formError}
          </div>
        )}
        {fields.map((f) => {
          const id = `f-${f.name}`,
            err = e[f.name],
            a11y = { "aria-invalid": err ? true : undefined, "aria-describedby": err ? `${id}-err` : undefined };
          return (
            <div className="field" key={f.name}>
              {f.kind === "multi" ? (
                <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                  <legend style={{ fontSize: ".875rem", fontWeight: 500, marginBottom: 4, padding: 0 }}>{f.label}</legend>
                  <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid var(--field)", borderRadius: 8, padding: 8 }}>
                    {f.options?.map((o) => (
                      <label key={o.value} style={{ display: "flex", gap: 8, fontWeight: 400, padding: "2px 0" }}>
                        <input
                          type="checkbox"
                          name={f.name}
                          value={o.value}
                          defaultChecked={list(f.name).includes(o.value)}
                          style={{ width: 18, height: 18, accentColor: "var(--fg)" }}
                        />
                        <span>{o.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : (
                <>
                  <label htmlFor={id}>{f.label}</label>
                  {f.kind === "textarea" ? (
                    <textarea id={id} name={f.name} rows={f.rows ?? 3} defaultValue={String(val(f.name))} {...a11y} />
                  ) : f.kind === "select" ? (
                    <select id={id} name={f.name} defaultValue={String(val(f.name))} {...a11y}>
                      <option value="">Choose</option>
                      {f.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={id}
                      name={f.name}
                      type={f.kind === "number" ? "number" : "text"}
                      defaultValue={String(val(f.name))}
                      {...a11y}
                    />
                  )}
                </>
              )}
              {f.hint && <div className="hint">{f.hint}</div>}
              {err && (
                <div className="err" id={`${id}-err`} role="alert">
                  {err}
                </div>
              )}
            </div>
          );
        })}
        <div className="row">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving" : submit}
          </Button>
        </div>
        {state.ok && state.message && (
          <p className="ok" role="status">
            {state.message}
          </p>
        )}
      </form>
    </Card>
  );
}
