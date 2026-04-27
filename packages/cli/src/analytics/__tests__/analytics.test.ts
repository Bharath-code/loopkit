import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  categorizeICP,
  categorizeProblem,
  categorizeMVP,
} from "../../analytics/competitorRadar";
import { getCachedRadar, setCachedRadar, clearExpiredCache } from "../../storage/cache";

const TEST_BASE = fs.mkdtempSync(path.join(os.tmpdir(), "loopkit-test-"));

function setCwdToTestDir(): void {
  process.chdir(TEST_BASE);
}

function cleanupTestDir(): void {
  if (fs.existsSync(TEST_BASE)) {
    fs.rmSync(TEST_BASE, { recursive: true, force: true });
  }
}

describe("categorizeICP", () => {
  it("classifies freelancers", () => {
    expect(categorizeICP("freelance designers")).toBe("freelancers");
    expect(categorizeICP("contractor developers")).toBe("freelancers");
    expect(categorizeICP("consultants")).toBe("freelancers");
    expect(categorizeICP("agency work")).toBe("freelancers");
  });

  it("classifies SaaS founders", () => {
    expect(categorizeICP("SaaS founders")).toBe("saas founders");
    expect(categorizeICP("startup CEOs")).toBe("saas founders");
    expect(categorizeICP("CTOs at startups")).toBe("saas founders");
  });

  it("classifies creators", () => {
    expect(categorizeICP("YouTubers")).toBe("creators");
    expect(categorizeICP("podcasters")).toBe("creators");
    expect(categorizeICP("content creators")).toBe("creators");
  });

  it("classifies ecommerce", () => {
    expect(categorizeICP("Shopify store owners")).toBe("ecommerce");
    expect(categorizeICP("D2C brands")).toBe("ecommerce");
  });

  it("classifies developers", () => {
    expect(categorizeICP("devops engineers")).toBe("developers");
    expect(categorizeICP("programmers")).toBe("developers");
  });

  it("classifies students", () => {
    expect(categorizeICP("college students")).toBe("students");
    expect(categorizeICP("online learning")).toBe("students");
  });

  it("classifies health & wellness", () => {
    expect(categorizeICP("fitness enthusiasts")).toBe("health & wellness");
    expect(categorizeICP("medical professionals")).toBe("health & wellness");
  });

  it("classifies finance", () => {
    expect(categorizeICP("crypto traders")).toBe("finance");
    expect(categorizeICP("investors")).toBe("finance");
  });

  it("classifies marketers", () => {
    expect(categorizeICP("SEO specialists")).toBe("marketers");
    expect(categorizeICP("growth hackers")).toBe("marketers");
  });

  it("defaults to general", () => {
    expect(categorizeICP("random people")).toBe("general");
    expect(categorizeICP("")).toBe("general");
  });

  it("is case insensitive", () => {
    expect(categorizeICP("FREELANCERS")).toBe("freelancers");
    expect(categorizeICP("SaAs FoUnDeRs")).toBe("saas founders");
  });
});

describe("categorizeProblem", () => {
  it("classifies proposal creation", () => {
    expect(categorizeProblem("writing proposals")).toBe("proposal creation");
    expect(categorizeProblem("pitch decks")).toBe("proposal creation");
  });

  it("classifies email outreach", () => {
    expect(categorizeProblem("cold email campaigns")).toBe("email outreach");
    expect(categorizeProblem("follow-up sequences")).toBe("email outreach");
  });

  it("classifies content creation", () => {
    expect(categorizeProblem("blog writing")).toBe("content creation");
    expect(categorizeProblem("social media posts")).toBe("content creation");
  });

  it("classifies scheduling", () => {
    expect(categorizeProblem("meeting booking")).toBe("scheduling");
    expect(categorizeProblem("calendar management")).toBe("scheduling");
  });

  it("classifies billing & payments", () => {
    expect(categorizeProblem("invoicing clients")).toBe("billing & payments");
    expect(categorizeProblem("payment processing")).toBe("billing & payments");
  });

  it("classifies analytics", () => {
    expect(categorizeProblem("tracking metrics")).toBe("analytics");
    expect(categorizeProblem("dashboard reporting")).toBe("analytics");
  });

  it("classifies customer management", () => {
    expect(categorizeProblem("CRM pipeline")).toBe("customer management");
    expect(categorizeProblem("lead management")).toBe("customer management");
  });

  it("classifies workflow automation", () => {
    expect(categorizeProblem("repetitive processes")).toBe("workflow automation");
    expect(categorizeProblem("workflow optimization")).toBe("workflow automation");
  });

  it("classifies hiring & recruiting", () => {
    expect(categorizeProblem("hiring talent")).toBe("hiring & recruiting");
    expect(categorizeProblem("team staffing")).toBe("hiring & recruiting");
  });

  it("defaults to other", () => {
    expect(categorizeProblem("something random")).toBe("other");
    expect(categorizeProblem("")).toBe("other");
  });
});

describe("categorizeMVP", () => {
  it("classifies web apps", () => {
    expect(categorizeMVP("SaaS platform")).toBe("web app");
    expect(categorizeMVP("web dashboard")).toBe("web app");
  });

  it("classifies mobile apps", () => {
    expect(categorizeMVP("iOS and Android app")).toBe("mobile app");
  });

  it("classifies API/plugins", () => {
    expect(categorizeMVP("API integration")).toBe("api/plugin");
    expect(categorizeMVP("plugin development")).toBe("api/plugin");
  });

  it("classifies browser extensions", () => {
    expect(categorizeMVP("chrome extension")).toBe("browser extension");
    expect(categorizeMVP("browser plugin")).toBe("browser extension");
  });

  it("classifies CLI tools", () => {
    expect(categorizeMVP("command line tool")).toBe("cli tool");
    expect(categorizeMVP("terminal utility")).toBe("cli tool");
  });

  it("classifies content/newsletter", () => {
    expect(categorizeMVP("weekly newsletter")).toBe("content/newsletter");
    expect(categorizeMVP("email blog")).toBe("content/newsletter");
  });

  it("classifies services", () => {
    expect(categorizeMVP("consulting agency")).toBe("service");
    expect(categorizeMVP("done-for-you service")).toBe("service");
  });

  it("defaults to other", () => {
    expect(categorizeMVP("something weird")).toBe("other");
  });
});

describe("radar cache", () => {
  beforeEach(() => {
    cleanupTestDir();
    fs.mkdirSync(TEST_BASE);
    setCwdToTestDir();
  });

  afterEach(() => cleanupTestDir());

  it("returns null for missing cache", () => {
    expect(getCachedRadar("test-key", 60000)).toBeNull();
  });

  it("round-trips cached data", () => {
    const data = { launches: [], category: "saas", scannedAt: "now", totalFound: 0 };
    setCachedRadar("test-key", 60000, data);
    const cached = getCachedRadar("test-key", 60000);
    expect(cached).toEqual(data);
  });

  it("returns null for expired cache", async () => {
    const data = { launches: [], category: "saas", scannedAt: "now", totalFound: 0 };
    setCachedRadar("expired-key", 10, data);
    await new Promise((r) => setTimeout(r, 20));
    const cached = getCachedRadar("expired-key", 10);
    expect(cached).toBeNull();
  });

  it("clears expired cache files", async () => {
    const data = { launches: [], category: "saas", scannedAt: "now", totalFound: 0 };
    setCachedRadar("clear-me", 10, data);
    setCachedRadar("keep-me", 60000, data);

    await new Promise((r) => setTimeout(r, 20));

    const cleared = clearExpiredCache();
    expect(cleared).toBeGreaterThanOrEqual(1);

    expect(getCachedRadar("clear-me", 10)).toBeNull();
    expect(getCachedRadar("keep-me", 60000)).toEqual(data);
  });
});
