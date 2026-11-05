import type { Metadata } from "next";
import { guard } from "@/lib/auth/guard";
import { SignInForm } from "@/features/auth/sign-in-form";
import { safeRedirect } from "@/lib/utils/safe-redirect";

export const metadata: Metadata = { title: "Sign in" };
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  await guard("/sign-in");
  const { next } = await searchParams;
  return <SignInForm next={next ? safeRedirect(next, "") : undefined} />;
}
