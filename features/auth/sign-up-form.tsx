"use client";
import Link from "next/link";
import { useActionState } from "react";
import { signUpAction } from "./actions";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Card, Logo } from "@/components/ui/misc";
import type { FormState } from "@/lib/utils/form";

const initial: FormState = {};

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpAction, initial);
  const e = state.errors ?? {},
    v = state.values ?? {};
  return (
    <div className="center">
      <Card className="auth fade">
        <form action={action} noValidate>
          <Logo />
          <h1>Create your account</h1>
          <p className="mut" style={{ marginTop: 8 }}>
            You will choose your career stage and goals in the next step.
          </p>
          <TextField id="name" label="Full name" autoComplete="name" defaultValue={v.name} error={e.name} />
          <TextField id="email" label="Email" type="email" autoComplete="email" defaultValue={v.email} error={e.email} />
          <TextField
            id="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            hint="At least 10 characters with a letter and a number."
            error={e.password}
          />
          <TextField id="confirmPassword" label="Confirm password" type="password" autoComplete="new-password" error={e.confirmPassword} />
          <div className="field">
            <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontWeight: 400 }}>
              <input type="checkbox" name="acceptTerms" style={{ width: 20, height: 20, marginTop: 2, accentColor: "var(--fg)" }} />
              <span>
                I accept the{" "}
                <Link className="lk" href="/terms">
                  terms
                </Link>{" "}
                and{" "}
                <Link className="lk" href="/privacy">
                  privacy policy
                </Link>
                .
              </span>
            </label>
            {e.acceptTerms && (
              <div className="err" role="alert">
                {e.acceptTerms}
              </div>
            )}
          </div>
          <div className="row">
            <Button type="submit" disabled={pending}>
              {pending ? "Creating" : "Create account"}
            </Button>
            <Link className="btn o" href="/sign-in">
              I have an account
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
