import { expect, test } from "@playwright/test";

const email = () => `e2e.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
const password = "longenough123";

test("register, onboard as a professional, edit profile, sign out, sign back in", async ({ page }) => {
  const mail = email();
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Prepare Smarter. Interview With Confidence.");

  await page.getByRole("link", { name: "Start Preparing" }).first().click();
  await page.getByLabel("Full name").fill("Ravi Kumar");
  await page.getByLabel("Email").fill(mail);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByLabel(/I accept/).check();
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByLabel(/Working professional/).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Preferred career domain").fill("Data and AI");
  await page.getByLabel(/Target role/).fill("ML engineer");
  await page.getByLabel("Self assessed experience level").selectOption("ADVANCED");
  await page.getByLabel("Years of experience").fill("6");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("System design").check();
  await page.getByRole("button", { name: "Finish" }).click();

  await expect(page).toHaveURL(/\/professional\/dashboard/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Welcome, Ravi");

  await page.goto("/student/dashboard");
  await expect(page).toHaveURL(/\/professional\/dashboard/); // cross role access is redirected

  await page.getByRole("link", { name: "My Profile" }).click();
  await page.getByLabel("Target role or career transition").fill("Staff ML engineer");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Profile saved")).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).first().click();
  await expect(page).toHaveURL("/");
  await page.goto("/professional/dashboard");
  await expect(page).toHaveURL(/\/sign-in/);

  await page.getByLabel("Email").fill(mail);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/professional\/dashboard/);
  await expect(page.getByText("Staff ML engineer")).toBeVisible();
});

test("landing page is usable on a phone: menu opens and reaches a section", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("link", { name: "FAQ" }).click();
  await expect(page.locator("#faq")).toBeInViewport();
});
