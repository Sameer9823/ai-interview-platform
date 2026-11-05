"use client";
import Link from "next/link";
import { useActionState } from "react";
import { signInAction } from "./actions";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Card, Logo } from "@/components/ui/misc";
import type { FormState } from "@/lib/utils/form";

const initial: FormState = {};

export function SignInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signInAction, initial);
  const e = state.errors ?? {};
  return (
    <div className="center">
      <Card className="auth fade">
        <form action={action} noValidate>
          <Logo />
          <h1>Welcome back</h1>
          <input type="hidden" name="next" value={next ?? ""} />
          <TextField id="email" label="Email" type="email" autoComplete="email" defaultValue={state.values?.email} error={e.email} />
          <TextField id="password" label="Password" type="password" autoComplete="current-password" error={e.password} />
          {state.formError && (
            <div className="err" role="alert">
              {state.formError}
            </div>
          )}
          <div className="row">
            <Button type="submit" disabled={pending}>
              {pending ? "Signing in" : "Sign in"}
            </Button>
            <Link className="btn o" href="/sign-up">
              Create account
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
