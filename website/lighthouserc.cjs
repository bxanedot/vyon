// Lighthouse CI audits production-built static pages, not the protected
// preview domain. The default Lighthouse mobile profile is intentional.
module.exports = {
  ci: {
    collect: {
      staticDistDir: "./dist",
      url: [
        "http://localhost/",
        "http://localhost/features.html",
        "http://localhost/download.html"
      ],
      numberOfRuns: 2,
      settings: {
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
        chromeFlags: "--no-sandbox --disable-dev-shm-usage",
        emulatedFormFactor: "mobile"
      }
    },
    assert: {
      assertions: {
        // Track performance as an actionable warning until stable baseline
        // measurements exist; keep layout shifts as a hard failure.
        "categories:performance": ["warn", {minScore: 0.6, aggregationMethod: "median"}],
        "categories:accessibility": ["warn", {minScore: 0.85, aggregationMethod: "median"}],
        "categories:seo": ["error", {minScore: 0.85, aggregationMethod: "median"}],
        "cumulative-layout-shift": ["error", {maxNumericValue: 0.25, aggregationMethod: "median"}],
        "largest-contentful-paint": ["warn", {maxNumericValue: 5000, aggregationMethod: "median"}],
        "total-blocking-time": ["warn", {maxNumericValue: 700, aggregationMethod: "median"}]
      }
    },
    upload: {
      target: "filesystem",
      outputDir: "./lighthouse-reports"
    }
  }
};
