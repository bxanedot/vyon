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


test("editorial design loads as real CSS and preserves the content system", async ({page}) => {
  await page.goto("/", {waitUntil: "load"});
  const link = page.locator('link[rel="stylesheet"][href="/studio.css"]');
  await expect(link).toHaveCount(1);
  const response = await page.request.get("/studio.css");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/css");
  const htmlStyles = await page.locator("body").evaluate(node => {
    const heading = document.querySelector(".hero h1");
    const card = document.querySelector(".platform-card");
    return {
      background: getComputedStyle(node).backgroundColor,
      font: getComputedStyle(heading).fontFamily,
      cardRadius: parseFloat(getComputedStyle(card).borderTopLeftRadius),
      heroLabel: Boolean(document.querySelector(".hero-stage-note"))
    };
  });
  expect(htmlStyles.background).not.toBe("rgba(0, 0, 0, 0)");
  expect(htmlStyles.font).not.toBe('"Times New Roman"');
  expect(htmlStyles.cardRadius).toBeGreaterThanOrEqual(18);
  expect(htmlStyles.heroLabel).toBe(true);
  await expect(page.locator(".platform-card")).toHaveCount(4);
  await expect(page.locator(".screenshot-tabs button")).toHaveCount(3);
  await expect(page.locator(".faq-item")).toHaveCount(6);
});

test("existing accent switching and equalizer remain usable", async ({page}) => {
  await page.goto("/", {waitUntil: "domcontentloaded"});
  await page.locator('[data-color="ice"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-accent", "ice");
  await expect(page.locator('[data-color="ice"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#vqe-preset-title")).toBeVisible();
  await expect(page.locator("#orb-canvas")).toBeAttached();
});

test("hero text stays within the visible viewport", async ({page}) => {
  await page.goto("/", {waitUntil: "load"});
  const metrics = await page.locator(".hero h1").evaluate(element => {
    const bounds = element.getBoundingClientRect();
    return {left: bounds.left, right: bounds.right, width: innerWidth};
  });
  expect(metrics.left).toBeGreaterThanOrEqual(-2);
  expect(metrics.right).toBeLessThanOrEqual(metrics.width + 3);
});

test("new editorial layer respects reduced motion", async ({page}) => {
  await page.emulateMedia({reducedMotion: "reduce"});
  await page.goto("/", {waitUntil: "load"});
  const transition = await page.locator(".platform-card").first().evaluate(
    element => getComputedStyle(element).transitionDuration
  );
  expect(transition.split(",").every(x => x.trim() === "0s")).toBe(true);
});


test("capture review screenshots for desktop and mobile", async ({page}, testInfo) => {
  await page.goto("/", {waitUntil: "load"});
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: "test-results/preview-" + testInfo.project.name + ".png",
    animations: "disabled",
    fullPage: true
  });
});
