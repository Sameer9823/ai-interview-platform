import type { Metadata } from "next";
import { LegalPage } from "@/components/landing/legal-page";

export const metadata: Metadata = { title: "Privacy Policy" };
export default function Page() {
  return (
    <LegalPage title="Privacy Policy">
      <h2>What we collect</h2>
      <p>
        Your name, email address and a hashed password. The career profile you enter: career stage, domain, target role, experience level,
        education or work details, skills to improve and preparation goals. Your preferences and a short history of account activity.
      </p>
      <h2>How we use it</h2>
      <p>
        To sign you in, personalize your dashboard and suggest next steps. We do not sell your data and we do not share your profile or
        results with companies.
      </p>
      <h2>AI features</h2>
      <p>
        AI features are not available yet. When they are, we will tell you what is sent to an AI provider, keep personal details out of
        prompts where possible, and ask for your consent first.
      </p>
      <h2>Your choices</h2>
      <ul>
        <li>Edit your profile and goals at any time.</li>
        <li>Delete your account from Settings. Your profile, goals, preferences and activity are removed.</li>
      </ul>
      <h2>Retention</h2>
      <p>We keep your data while your account exists. This section will list exact retention periods before launch.</p>
      <h2>Contact</h2>
      <p>Add a contact address here before launch.</p>
    </LegalPage>
  );
}
