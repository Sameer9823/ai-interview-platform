import Link from "next/link";
import { Logo } from "@/components/ui/misc";

export function LandingFooter() {
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return (
    <footer className="lp-foot">
      <div className="lp-page cols">
        <div>
          <Logo />
          <p>
            {process.env.NEXT_PUBLIC_APP_NAME ?? "InterviewPilot"} is a temporary product name. Interview and career preparation for
            students, freshers and working professionals.
          </p>
        </div>
        <div>
          <h3>Product</h3>
          <ul>
            <li>
              <Link href="/#features">Features</Link>
            </li>
            <li>
              <Link href="/#how">How It Works</Link>
            </li>
            <li>
              <Link href="/#students">For Students</Link>
            </li>
            <li>
              <Link href="/#professionals">For Professionals</Link>
            </li>
            <li>
              <Link href="/#faq">FAQ</Link>
            </li>
          </ul>
        </div>
        <div>
          <h3>Company</h3>
          <ul>
            <li>
              <Link href="/privacy">Privacy Policy</Link>
            </li>
            <li>
              <Link href="/terms">Terms of Service</Link>
            </li>
            <li>
              {contact ? (
                <a href={`mailto:${contact}`}>Contact</a>
              ) : (
                <span aria-disabled="true" title="Set NEXT_PUBLIC_CONTACT_EMAIL to enable this link">
                  Contact (not configured)
                </span>
              )}
            </li>
          </ul>
        </div>
      </div>
      <div className="lp-page" style={{ marginTop: 32 }}>
        <p>
          © {new Date().getFullYear()} {process.env.NEXT_PUBLIC_APP_NAME ?? "InterviewPilot"}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
