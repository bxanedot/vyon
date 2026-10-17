import {test, expect} from "@playwright/test";

test("homepage keeps its identity and interactive particle canvas", async ({page}) => {
  await page.goto("/", {waitUntil: "domcontentloaded"});
  await expect(page.locator("main h1")).toContainText("A different");
  await expect(page.locator("#orb-canvas")).toBeAttached();
  await expect(page.locator(".hero-atmosphere")).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator('a.hero-download-btn[href="#downloads"]')).toBeAttached();
  await expect(page.locator("#downloads")).toBeAttached();
});

test("navigation is usable on desktop and mobile", async ({page}, testInfo) => {
  await page.goto("/", {waitUntil: "domcontentloaded"});
  if (testInfo.project.name === "mobile-chromium") {
    const menu = page.locator("#mobile-menu");
    const toggle = page.locator("#mobile-menu-btn");
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(menu).toBeVisible();
    await menu.locator('a[href="#faq"]').click();
    await expect(menu).toBeHidden();
  } else {
    const trigger = page.locator("#command-trigger");
    await expect(trigger).toBeVisible();
    await trigger.click();
    await expect(page.locator("#command-overlay")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#command-overlay")).toBeHidden();
  }
});

test("guide pages are distinct, indexable, and interconnected", async ({page}) => {
  for (const slug of ["download", "features", "android", "desktop", "faq"]) {
    await page.goto("/" + slug + ".html", {waitUntil: "domcontentloaded"});
    await expect(page.locator("main h1")).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://vyon.live/" + slug);
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
    await expect(page.locator('.seo-nav a[href="/download"]')).toBeAttached();
    await expect(page.locator('.seo-nav a[href="/features"]')).toBeAttached();
  }
});

test("reduced motion disables ambient animations", async ({page}) => {
  await page.emulateMedia({reducedMotion: "reduce"});
  await page.goto("/", {waitUntil: "domcontentloaded"});
  const homeAnimation = await page.locator(".hero-atmosphere").evaluate(
    element => getComputedStyle(element).animationName
  );
  expect(homeAnimation).toBe("none");

  await page.goto("/features.html", {waitUntil: "domcontentloaded"});
  const guideAnimation = await page.locator(".seo-hero").evaluate(
    element => getComputedStyle(element, "::before").animationName
  );
  expect(guideAnimation).toBe("none");
});
