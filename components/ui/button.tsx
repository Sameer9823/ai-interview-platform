import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "solid" | "outline" | "danger";
const cls = (v: Variant, small?: boolean, extra?: string) =>
  ["btn", v === "outline" && "o", v === "danger" && "d", small && "s", extra].filter(Boolean).join(" ");

export function Button({
  variant = "solid",
  small,
  className,
  type = "button",
  size,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; small?: boolean; size?: string }) {
  return <button type={type} className={cls(variant, small, className)} {...rest} />;
}

export function LinkButton({
  href,
  variant = "solid",
  small,
  children,
}: {
  href: string;
  variant?: Variant;
  small?: boolean;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cls(variant, small)}>
      {children}
    </Link>
  );
}
