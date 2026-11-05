import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

interface Base {
  id: string;
  label: string;
  error?: string;
  hint?: string;
}

function Wrap({ id, label, error, hint, children }: Base & { children: ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && <div className="hint">{hint}</div>}
      {error && (
        <div className="err" id={`${id}-err`} role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
const a11y = (id: string, error?: string) => ({
  "aria-invalid": error ? true : undefined,
  "aria-describedby": error ? `${id}-err` : undefined,
});

export function TextField({ id, label, error, hint, ...rest }: Base & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Wrap id={id} label={label} error={error} hint={hint}>
      <input id={id} name={id} {...a11y(id, error)} {...rest} />
    </Wrap>
  );
}
export function SelectField({
  id,
  label,
  error,
  hint,
  options,
  ...rest
}: Base & { options: Record<string, string> } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Wrap id={id} label={label} error={error} hint={hint}>
      <select id={id} name={id} {...a11y(id, error)} {...rest}>
        <option value="">Choose</option>
        {Object.entries(options).map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </Wrap>
  );
}
export function TextAreaField({ id, label, error, hint, ...rest }: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Wrap id={id} label={label} error={error} hint={hint}>
      <textarea id={id} name={id} rows={3} maxLength={500} {...a11y(id, error)} {...rest} />
    </Wrap>
  );
}
