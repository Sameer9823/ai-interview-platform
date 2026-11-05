import type { Metadata } from "next";
import { LegalPage } from "@/components/landing/legal-page";

export const metadata: Metadata = { title: "Terms of Service" };
export default function Page() {
  return (
    <LegalPage title="Terms of Service">
      <h2>Using the service</h2>
      <p>You must provide accurate account details and keep your password private. You are responsible for activity on your account.</p>
      <h2>What the service is</h2>
      <p>
        A preparation tool. Feedback, plans and practice material are guidance. They do not predict or guarantee any hiring outcome, and
        nothing here is a hiring decision.
      </p>
      <h2>Acceptable use</h2>
      <p>Do not attempt to access other people&apos;s data, disrupt the service, or use it for anything unlawful.</p>
      <h2>Termination</h2>
      <p>You can delete your account at any time from Settings. We may suspend accounts that break these terms.</p>
      <h2>Changes</h2>
      <p>We may update these terms. This draft will be finalized and reviewed before launch.</p>
    </LegalPage>
  );
}
