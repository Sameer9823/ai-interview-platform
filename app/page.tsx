import "./landing.css";
import Link from "next/link";
import { Badge, Card } from "@/components/ui/misc";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingEffects } from "@/components/landing/landing-effects";
import { LandingFooter } from "@/components/landing/landing-footer";
import { getCurrent } from "@/lib/auth/session";
import { dashboardFor } from "@/lib/permissions";

const TAGLINE = "Every question you rehearse is one less surprise in the room. Preparation, organized around the job you want.";
const FEATURES: { name: string; text: string; soon?: boolean }[] = [
  {
    name: "Personalized preparation profile",
    text: "Tell us your career stage, target role and goals. Your dashboard and next steps are built from them.",
  },
  {
    name: "Technical and aptitude practice",
    text: "Timed sets and explained answers across fundamentals, coding and reasoning.",
    soon: true,
  },
  {
    name: "Behavioral interview preparation",
    text: "Rehearse HR and behavioral questions with a clear structure for your answers.",
    soon: true,
  },
  { name: "Resume improvement", text: "See how your resume reads against a role and get specific, explainable edits.", soon: true },
  { name: "AI mock interviews", text: "Practice with follow up questions and rubric based guidance on your answers.", soon: true },
  { name: "Career skill gap analysis", text: "Compare your skills with your target role and see what to work on first.", soon: true },
];
const STEPS = [
  ["Create your account", "Sign up with your email."],
  ["Choose your career stage and target role", "Student, fresher or working professional."],
  ["Build your preparation profile", "Add your goals and the skills you want to improve."],
  ["Follow your preparation journey", "Your dashboard shows only what you actually did."],
];
const FAQ: [string, string][] = [
  [
    "Who can use this platform?",
    "Students and freshers preparing for placements and first roles, and working professionals preparing for a job change, promotion or career transition.",
  ],
  [
    "How does personalization work?",
    "You choose your career stage, target role, experience level and preparation goals. Recommended next steps come from what is missing or relevant in your profile. Nothing is guessed about you.",
  ],
  [
    "Are the AI features available yet?",
    "Not yet. AI mock interviews, resume analysis and skill gap analysis are planned and marked Coming soon. Today you can create your profile, set goals and use your dashboard.",
  ],
  [
    "How is my account data handled?",
    "Your details are used to personalize your preparation. Passwords are stored as hashes, and you can delete your account from Settings. See the privacy policy for more.",
  ],
];

export default async function Home() {
  const { record } = await getCurrent();
  const dashboardHref = record
    ? record.onboardingDone && record.careerStage
      ? dashboardFor(record.careerStage)
      : "/onboarding"
    : undefined;
  return (
    <div className="lp">
      <div id="lp-sentinel" aria-hidden="true" />
      <LandingHeader dashboardHref={dashboardHref} />
      <main id="main">
        <section className="lp-hero">
          <svg className="lp-hex" aria-hidden="true">
            <defs>
              <pattern id="hx" width="56" height="100" patternUnits="userSpaceOnUse">
                <path d="M28 66L0 50L0 16L28 0L56 16L56 50L28 66L28 100" fill="none" stroke="currentColor" />
                <path d="M28 0L28 34L0 50L0 84L28 100L56 84L56 50L28 34" fill="none" stroke="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hx)" />
          </svg>
          <div className="lp-page">
            <h1>Prepare Smarter. Interview With Confidence.</h1>
            <p className="lead">
              Personalized interview preparation for students, freshers and experienced professionals. Build your profile, set your goals
              and see <span className="hl">what to work on next</span>.
            </p>
            <div className="lp-cta">
              <Link className="btn solid" href={dashboardHref ?? "/sign-up"}>
                {dashboardHref ? "Open dashboard" : "Start Preparing"}
              </Link>
              <a className="btn outline" href="#features">
                Explore Features
              </a>
            </div>
            <p className="lp-note">
              AI practice tools are in development. Today you can create a profile, set goals and use your dashboard.
            </p>
            <Card className="lp-preview" style={{ maxWidth: 560 }}>
              <Badge>Sample layout, not real data</Badge>
              <h3 style={{ marginTop: 12 }}>Your dashboard</h3>
              <p className="sm mut">Profile completion, goals, next steps and recent activity appear here, based only on what you do.</p>
              <div className="bar2" aria-hidden="true" style={{ width: "100%" }} />
              <div className="bar2" aria-hidden="true" style={{ width: "70%" }} />
              <div className="bar2" aria-hidden="true" style={{ width: "45%" }} />
            </Card>
          </div>
        </section>

        <section className="lp-tagline" aria-label="Our approach">
          <div className="lp-page">
            <p className="lp-tag">
              {TAGLINE.split(" ").map((w, i) => (
                <span className="w" key={i}>
                  {w}{" "}
                </span>
              ))}
            </p>
          </div>
        </section>

        <section id="features">
          <div className="lp-page">
            <h2 className="rv">Everything you need to get ready</h2>
            <p className="lead rv">Features are labeled honestly. Only what you can use today is marked as available.</p>
            <div className="lp-grid g3">
              {FEATURES.map((f) => (
                <div className="card rv" key={f.name}>
                  <Badge>{f.soon ? "Coming soon" : "Available now"}</Badge>
                  <h3 style={{ marginTop: 12 }}>{f.name}</h3>
                  <p className="sm mut" style={{ marginTop: 4 }}>
                    {f.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how" style={{ paddingTop: 0 }}>
          <div className="lp-page">
            <h2 className="rv">How it works</h2>
            <ol className="lp-steps">
              {STEPS.map(([t, d], i) => (
                <li className="card lp-step rv" key={t}>
                  <h3>
                    <span className="n">{i + 1}</span>
                    {t}
                  </h3>
                  <p className="sm mut" style={{ marginTop: 8 }}>
                    {d}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="students" style={{ paddingTop: 0 }}>
          <div className="lp-page">
            <h2 className="rv">For students and freshers</h2>
            <p className="lead rv">
              Placement season is easier with a plan. Prepare for campus rounds and first roles with practice built around your degree and
              target role.
            </p>
            <div className="lp-grid g2">
              <div className="card rv">
                <h3>What you can prepare for</h3>
                <ul className="list" style={{ marginTop: 12 }}>
                  {[
                    "Aptitude and reasoning rounds",
                    "Programming fundamentals and coding",
                    "Technical and HR interviews",
                    "Communication skills",
                    "Resume preparation for a first role",
                  ].map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <div className="card rv">
                <h3>Built around you</h3>
                <p className="sm mut" style={{ marginTop: 8 }}>
                  Share your education level, degree and graduation year if you like. Add a primary programming language and your goals.
                  Skip anything optional and fill it in later.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="professionals" style={{ paddingTop: 0 }}>
          <div className="lp-page">
            <h2 className="rv">For working professionals</h2>
            <p className="lead rv">Changing jobs or aiming for the next level? Prepare for the interviews that test depth and judgment.</p>
            <div className="lp-grid g2">
              <div className="card rv">
                <h3>What you can prepare for</h3>
                <ul className="list" style={{ marginTop: 12 }}>
                  {[
                    "Advanced technical interviews",
                    "System design discussions",
                    "Behavioral and managerial questions",
                    "Career transitions to a new role or domain",
                    "Finding and closing skill gaps",
                  ].map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <div className="card rv">
                <h3>Built around your experience</h3>
                <p className="sm mut" style={{ marginTop: 8 }}>
                  Tell us your years of experience, current role and target role. List the skills you want to improve, and your dashboard
                  keeps them in view.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" style={{ paddingTop: 0 }}>
          <div className="lp-page">
            <h2 className="rv">Frequently asked questions</h2>
            <div className="lp-faq rv">
              {FAQ.map(([q, a]) => (
                <details key={q}>
                  <summary>{q}</summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section style={{ paddingTop: 0 }}>
          <div className="lp-page">
            <Card className="rv" style={{ padding: "48px 24px" }}>
              <h2>Prepare Smarter. Interview With Confidence.</h2>
              <div className="lp-cta">
                <Link className="btn solid" href={dashboardHref ?? "/sign-up"}>
                  {dashboardHref ? "Open dashboard" : "Start Preparing"}
                </Link>
                <a className="btn outline" href="#features">
                  Explore Features
                </a>
              </div>
            </Card>
          </div>
        </section>
      </main>
      <LandingFooter />
      <LandingEffects />
    </div>
  );
}
