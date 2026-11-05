import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import "./globals.css";

const name = process.env.NEXT_PUBLIC_APP_NAME ?? "InterviewPilot";
export const metadata: Metadata = {
  title: { default: `${name}: AI interview and career preparation`, template: `%s | ${name}` },
  description: "Improve your resume, rehearse tough interview questions and see what to work on next.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const theme = (await cookies()).get("ip-theme")?.value === "light" ? "light" : "dark";
  return (
    <html lang="en" data-theme={theme}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- this rule targets the Pages Router; the App Router root layout is the right place */}
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600&family=Montserrat:wght@500;600&family=Onest:wght@600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
