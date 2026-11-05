/** Radio or checkbox cards. Selected state uses a border, a fill AND the native checked control, never colour alone. */
interface Option {
  value: string;
  label: string;
  hint?: string;
}

export function ChoiceGroup({
  legend,
  name,
  type,
  options,
  defaultValue = [],
  error,
  onChange,
}: {
  legend: string;
  name: string;
  type: "radio" | "checkbox";
  options: Option[];
  defaultValue?: string[];
  error?: string;
  onChange?: (selected: string[]) => void;
}) {
  return (
    <fieldset className="field" style={{ border: 0, padding: 0, margin: "16px 0 0" }}>
      <legend style={{ fontSize: 14, lineHeight: "20px", fontWeight: 500, marginBottom: 8, padding: 0 }}>{legend}</legend>
      <div className="opts">
        {options.map((o) => (
          <label className="opt" key={o.value}>
            <input
              type={type}
              name={name}
              value={o.value}
              defaultChecked={defaultValue.includes(o.value)}
              onChange={
                onChange
                  ? (ev) => {
                      const form = ev.currentTarget.form;
                      if (!form) return;
                      onChange(Array.from(form.querySelectorAll<HTMLInputElement>(`input[name="${name}"]:checked`)).map((i) => i.value));
                    }
                  : undefined
              }
            />
            <b>{o.label}</b>
            {o.hint && <span>{o.hint}</span>}
          </label>
        ))}
      </div>
      {error && (
        <div className="err" role="alert">
          {error}
        </div>
      )}
    </fieldset>
  );
}
