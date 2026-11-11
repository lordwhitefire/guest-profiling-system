import { test, expect } from "@playwright/test";

test.describe("TASK-001 smoke tests", () => {
  test("home page renders", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Guest Profiling System/);
  });

  test("login page renders and accepts form input", async ({ page }) => {
    await page.goto("/login");
    // Form is present.
    await expect(page.locator("form")).toBeVisible();
    // Email input exists and accepts input.
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill("test@example.com");
    await expect(emailInput).toHaveValue("test@example.com");
    // Password input exists.
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill("some-password");
    await expect(passwordInput).toHaveValue("some-password");
    // Submit button exists.
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("design system page renders all base components", async ({ page }) => {
    await page.goto("/design-system");
    await expect(page.locator("h1")).toHaveText("Design System");
    // Buttons section.
    await expect(page.getByText("Primary")).toBeVisible();
    await expect(page.getByText("Secondary")).toBeVisible();
    await expect(page.getByText("Ghost")).toBeVisible();
    await expect(page.getByText("Destructive")).toBeVisible();
    // Badges section.
    await expect(page.getByText("Checked in")).toBeVisible();
    await expect(page.getByText("Pending")).toBeVisible();
    await expect(page.getByText("Escalated")).toBeVisible();
    // Card section.
    await expect(page.getByText("John Doe")).toBeVisible();
  });

  test("unauthenticated /admin/* redirects to /login", async ({ page }) => {
    const response = await page.goto("/admin/tenants");
    // Either redirected to /login OR got 403 — both are acceptable per the middleware.
    if (response) {
      const url = page.url();
      const status = response.status();
      expect(
        url.includes("/login") || status === 403,
        `Expected redirect to /login or 403, got status ${status} and URL ${url}`
      ).toBeTruthy();
    }
  });
});
