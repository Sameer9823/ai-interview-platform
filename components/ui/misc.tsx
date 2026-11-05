import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, OptionHTMLAttributes, MouseEventHandler, ChangeEvent } from "react";

export const Card = ({ children, className = "", style, onClick }: { children?: ReactNode; className?: string; style?: React.CSSProperties; onClick?: MouseEventHandler<HTMLDivElement> }) => (
  <div className={`card ${className}`} style={style} onClick={onClick}>
    {children}
  </div>
);
export const Badge = ({ children, className = "", style }: { children?: ReactNode; className?: string; style?: React.CSSProperties }) => <span className={`badge ${className}`} style={style}>{children}</span>;
export const EmptyState = ({ children }: { children?: ReactNode }) => <div className="empty">{children}</div>;
export const Logo = () => (
  <div className="logo">
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path d="M12 2l8.66 5v10L12 22l-8.66-5V7z" fill="var(--brand)" />
    </svg>
    <span>{process.env.NEXT_PUBLIC_APP_NAME ?? "InterviewPilot"}</span>
  </div>
);
export const ProgressBar = ({ percent, style }: { percent: number; style?: React.CSSProperties }) => (
  <div className="bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} style={style}>
    <i style={{ width: `${percent}%` }} />
  </div>
);

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string };
export const Input = ({ label, className = "", style, ...props }: InputProps) => (
  <div className="input-wrap">
    {label && <label className="mut" style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>{label}</label>}
    <input className={`input ${className}`} style={style} {...props} />
  </div>
);

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string };
export const Textarea = ({ label, className = "", style, ...props }: TextareaProps) => (
  <div className="input-wrap">
    {label && <label className="mut" style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>{label}</label>}
    <textarea className={`input ${className}`} style={style} {...props} />
  </div>
);

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: { value: string; label: string }[] | Record<string, string> };
export const Select = ({ label, className = "", style, options, value, ...props }: SelectProps) => {
  const opts: { value: string; label: string }[] = Array.isArray(options)
    ? options
    : Object.entries(options).map(([v, l]) => ({ value: v, label: l }));
  return (
    <div className="input-wrap">
      {label && <label className="mut" style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>{label}</label>}
      <select className={`input ${className}`} style={style} value={value} {...props}>
        {opts.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
};
