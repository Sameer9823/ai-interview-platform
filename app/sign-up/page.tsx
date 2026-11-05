import type { Metadata } from "next";
import { guard } from "@/lib/auth/guard";
import { SignUpForm } from "@/features/auth/sign-up-form";

export const metadata: Metadata = { title: "Create account" };
export default async function Page() {
  await guard("/sign-up");
  return <SignUpForm />;
}
