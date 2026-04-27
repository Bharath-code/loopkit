import { type MarketSignal, MarketSignalSchema } from "@loopkit/shared";
import { getCachedRadar, setCachedRadar } from "../storage/cache.js";
import { log } from "./logger.js";
import { getSearchKeywords } from "./competitorRadar.js";

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const FUNDING_BASELINE = 3;
const DEV_BASELINE = 100;
const HIRING_BASELINE = 5;

interface CrunchbaseItem {
  title: string;
  link: string;
  pubDate: string;
}

interface GitHubTrendingRepo {
  name: string;
  stars: number;
  language: string;
  description: string;
}

interface JobPosting {
  title: string;
  company: string;
  location: string;
  date: string;
}

async function fetchCrunchbaseRSS(keywords: string[]): Promise<{ count: number; items: CrunchbaseItem[] }> {
  try {
    const query = keywords.slice(0, 3).join("+");
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`funding ${query}`)}&hl=en-US&gl=US&ceid=US:en`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "loopkit-cli/1.0" },
    });

    if (!response.ok) return { count: 0, items: [] };

    const text = await response.text();
    const items = parseRSSItems(text);

    const relevant = items.filter((item) => {
      const text = `${item.title} ${item.link}`.toLowerCase();
      return keywords.some((kw) => text.includes(kw.toLowerCase())) &&
        (text.includes("fund") || text.includes("invest") || text.includes("raise") || text.includes("capital"));
    });

    return { count: relevant.length, items: relevant.slice(0, 10) };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (err.name !== "AbortError") {
      log("error", "marketTiming", "Funding news fetch failed", { error: err.message });
    }
    return { count: 0, items: [] };
  }
}

function parseRSSItems(xml: string): CrunchbaseItem[] {
  const items: CrunchbaseItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const titleMatch = block.match(/<title>(.*?)<\/title>/);
    const linkMatch = block.match(/<link>(.*?)<\/link>/);
    const dateMatch = block.match(/<pubDate>(.*?)<\/pubDate>/);

    if (titleMatch && linkMatch) {
      items.push({
        title: titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1").trim(),
        link: linkMatch[1].trim(),
        pubDate: dateMatch?.[1] || "",
      });
    }
  }

  return items;
}

async function fetchGitHubTrending(keywords: string[]): Promise<{ growth: number; repos: GitHubTrendingRepo[] }> {
  try {
    const fetchPromises = keywords.slice(0, 3).map(async (kw) => {
      const response = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(kw)}&sort=stars&order=desc&per_page=5`,
        { signal: AbortSignal.timeout(8000) }
      );

      if (!response.ok) return [];

      const data = await response.json();
      if (!data?.items) return [];

      return data.items.map((item: Record<string, unknown>) => ({
        name: String(item.full_name),
        stars: Number(item.stargazers_count) || 0,
        language: String(item.language || "unknown"),
        description: String(item.description || ""),
      }));
    });

    const results = await Promise.all(fetchPromises);
    const allRepos = results.flat();

    const totalStars = allRepos.reduce((sum, r) => sum + r.stars, 0);
    const avgStars = allRepos.length > 0 ? Math.round(totalStars / allRepos.length) : 0;

    return { growth: avgStars, repos: allRepos.slice(0, 10) };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (err.name !== "AbortError") {
      log("error", "marketTiming", "GitHub trending fetch failed", { error: err.message });
    }
    return { growth: 0, repos: [] };
  }
}

async function fetchJobPostings(keywords: string[]): Promise<{ count: number; postings: JobPosting[] }> {
  try {
    const fetchPromises = keywords.slice(0, 2).map(async (kw) => {
      const response = await fetch(
        `https://www.indeed.com/rss?q=${encodeURIComponent(kw)}&limit=10`,
        {
          signal: AbortSignal.timeout(8000),
          headers: { "User-Agent": "loopkit-cli/1.0" },
        }
      );

      if (!response.ok) return [];

      const text = await response.text();
      const postings: JobPosting[] = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;

      while ((match = itemRegex.exec(text)) !== null) {
        const block = match[1];
        const titleMatch = block.match(/<title>(.*?)<\/title>/);
        const descMatch = block.match(/<description>(.*?)<\/description>/);
        const dateMatch = block.match(/<pubDate>(.*?)<\/pubDate>/);

        if (titleMatch) {
          const title = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1").trim();
          const desc = descMatch
            ? descMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1").trim()
            : "";

          postings.push({
            title,
            company: extractCompany(desc),
            location: extractLocation(desc),
            date: dateMatch?.[1] || "",
          });
        }

        if (postings.length >= 10) break;
      }

      return postings;
    });

    const results = await Promise.all(fetchPromises);
    const allPostings = results.flat().slice(0, 20);

    return { count: allPostings.length, postings: allPostings };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (err.name !== "AbortError") {
      log("error", "marketTiming", "Indeed job postings fetch failed", { error: err.message });
    }
    return { count: 0, postings: [] };
  }
}

function extractCompany(description: string): string {
  const match = description.match(/([^<]+)\s*-\s*/);
  return match ? match[1].trim() : "Unknown";
}

function extractLocation(description: string): string {
  const match = description.match(/- ([^-]+)(?:\s*<|$)/);
  return match ? match[1].trim() : "Remote";
}

function computeTrend(current: number, baseline: number): "up" | "down" | "stable" {
  if (baseline === 0) return current > 0 ? "up" : "stable";
  const change = (current - baseline) / baseline;
  if (change > 0.15) return "up";
  if (change < -0.15) return "down";
  return "stable";
}

function computeCompositeScore(
  fundingTrend: "up" | "down" | "stable",
  devTrend: "up" | "down" | "stable",
  hiringTrend: "up" | "down" | "stable",
  fundingCount: number,
  devGrowth: number,
  hiringCount: number
): number {
  const trendScore =
    (trendValue(fundingTrend) + trendValue(devTrend) + trendValue(hiringTrend)) / 3;

  const magnitudeScore = Math.min(
    (Math.min(fundingCount, 10) / 10) * 30 +
      (Math.min(devGrowth, 500) / 500) * 30 +
      (Math.min(hiringCount, 20) / 20) * 40,
    100
  );

  return Math.round(trendScore * 0.5 + magnitudeScore * 0.5);
}

function trendValue(trend: "up" | "down" | "stable"): number {
  switch (trend) {
    case "up":
      return 1;
    case "stable":
      return 0.5;
    case "down":
      return 0;
  }
}

function signalLabel(compositeScore: number): "heating" | "cooling" | "stable" {
  if (compositeScore >= 65) return "heating";
  if (compositeScore <= 35) return "cooling";
  return "stable";
}

export async function analyzeMarket(category: string): Promise<{
  signal: MarketSignal;
  scannedAt: string;
}> {
  const cacheKey = `market:${category}`;

  const cached = getCachedRadar(cacheKey, CACHE_TTL_MS);
  if (cached) {
    return cached as { signal: MarketSignal; scannedAt: string };
  }

  const keywords = getSearchKeywords(category);

  const [funding, github, jobs] = await Promise.all([
    fetchCrunchbaseRSS(keywords),
    fetchGitHubTrending(keywords),
    fetchJobPostings(keywords),
  ]);

  const fundingTrend = computeTrend(funding.count, FUNDING_BASELINE);
  const devTrend = computeTrend(github.growth, DEV_BASELINE);
  const hiringTrend = computeTrend(jobs.count, HIRING_BASELINE);

  const compositeScore = computeCompositeScore(
    fundingTrend,
    devTrend,
    hiringTrend,
    funding.count,
    github.growth,
    jobs.count
  );

  const signal = MarketSignalSchema.parse({
    category,
    fundingTrend,
    fundingCount: funding.count,
    devTrend,
    devGrowth: github.growth,
    hiringTrend,
    hiringCount: jobs.count,
    compositeScore,
    signal: signalLabel(compositeScore),
    lastUpdated: new Date().toISOString(),
  });

  const result = { signal, scannedAt: new Date().toISOString() };

  setCachedRadar(cacheKey, CACHE_TTL_MS, result);

  return result;
}
