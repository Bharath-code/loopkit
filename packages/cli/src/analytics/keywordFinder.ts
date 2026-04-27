import { type KeywordOpportunity, KeywordOpportunitySchema } from "@loopkit/shared";
import { getCachedRadar, setCachedRadar } from "../storage/cache.js";
import { log } from "./logger.js";
import { getSearchKeywords, getProblemKeywords } from "./competitorRadar.js";

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface GoogleSuggestion {
  keyword: string;
  weight: number;
}

async function fetchGoogleAutocomplete(seed: string): Promise<GoogleSuggestion[]> {
  try {
    const url = `http://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(seed)}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });

    if (!response.ok) return [];

    const data = await response.json();
    if (!Array.isArray(data) || data.length < 2) return [];

    return (data[1] as string[]).map((s, i) => ({
      keyword: s,
      weight: 10 - i,
    }));
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (err.name !== "AbortError") {
      log("error", "keywordFinder", "Google Autocomplete fetch failed", {
        error: err.message,
        seed,
      });
    }
    return [];
  }
}

async function fetchRedditMentions(keyword: string): Promise<number> {
  try {
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(keyword)}&sort=new&limit=5`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "loopkit-cli/1.0" },
    });

    if (!response.ok) return 0;

    const data = await response.json();
    return data?.data?.children?.length || 0;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (err.name !== "AbortError") {
      log("error", "keywordFinder", "Reddit search failed", {
        error: err.message,
        keyword,
      });
    }
    return 0;
  }
}

async function fetchGitHubRepoCount(keyword: string): Promise<number> {
  try {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(keyword)}&per_page=1`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });

    if (!response.ok) return 0;

    const data = await response.json();
    return data?.total_count || 0;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (err.name !== "AbortError") {
      log("error", "keywordFinder", "GitHub search failed", {
        error: err.message,
        keyword,
      });
    }
    return 0;
  }
}

function computeVolumeProxy(suggestions: GoogleSuggestion[], redditCount: number): number {
  const suggestionScore = suggestions.length * 10 + suggestions.reduce((s, g) => s + g.weight, 0);
  const redditScore = Math.min(redditCount * 5, 50);
  return suggestionScore + redditScore;
}

function computeCompetitionProxy(githubCount: number, suggestionCount: number): number {
  const githubScore = Math.min(Math.log10(githubCount + 1) * 20, 50);
  const suggestionScore = Math.min(suggestionCount * 3, 30);
  return githubScore + suggestionScore;
}

function scoreKeyword(volume: number, competition: number): number {
  if (competition === 0) return volume > 0 ? 10 : 0;
  const raw = volume / competition;
  return Math.min(Math.round(raw * 10), 100);
}

function volumeLabel(proxy: number): "high" | "medium" | "low" {
  if (proxy > 80) return "high";
  if (proxy > 40) return "medium";
  return "low";
}

function competitionLabel(proxy: number): "low" | "medium" | "high" {
  if (proxy < 30) return "low";
  if (proxy < 60) return "medium";
  return "high";
}

export async function findKeywords(category: string, problemCategory?: string): Promise<{
  opportunities: KeywordOpportunity[];
  category: string;
  scannedAt: string;
  totalFound: number;
}> {
  const cacheKey = `keywords:${category}:${problemCategory || ""}`;

  const cached = getCachedRadar(cacheKey, CACHE_TTL_MS);
  if (cached) {
    return cached as {
      opportunities: KeywordOpportunity[];
      category: string;
      scannedAt: string;
      totalFound: number;
    };
  }

  const keywords = getSearchKeywords(category);
  if (problemCategory) {
    keywords.push(...getProblemKeywords(problemCategory));
  }

  const uniqueSeeds = [...new Set(keywords)].slice(0, 5);

  const allSuggestions: Map<string, GoogleSuggestion[]> = new Map();
  const allRedditCounts: Map<string, number> = new Map();
  const allGitHubCounts: Map<string, number> = new Map();

  const fetchPromises = uniqueSeeds.map(async (seed) => {
    const [suggestions, redditCount, githubCount] = await Promise.all([
      fetchGoogleAutocomplete(seed),
      fetchRedditMentions(seed),
      fetchGitHubRepoCount(seed),
    ]);

    allSuggestions.set(seed, suggestions);
    allRedditCounts.set(seed, redditCount);
    allGitHubCounts.set(seed, githubCount);
  });

  await Promise.all(fetchPromises);

  const opportunities: KeywordOpportunity[] = [];

  for (const seed of uniqueSeeds) {
    const suggestions = allSuggestions.get(seed) || [];
    const redditCount = allRedditCounts.get(seed) || 0;
    const githubCount = allGitHubCounts.get(seed) || 0;

    const volumeProxy = computeVolumeProxy(suggestions, redditCount);
    const competitionProxy = computeCompetitionProxy(githubCount, suggestions.length);
    const score = scoreKeyword(volumeProxy, competitionProxy);

    const sources: string[] = [];
    if (suggestions.length > 0) sources.push("google-autocomplete");
    if (redditCount > 0) sources.push("reddit");
    if (githubCount > 0) sources.push("github");

    const opportunity = KeywordOpportunitySchema.parse({
      keyword: seed,
      score,
      volume: volumeLabel(volumeProxy),
      competition: competitionLabel(competitionProxy),
      sources,
      suggestions: suggestions.map((s) => s.keyword).slice(0, 5),
    });

    opportunities.push(opportunity);
  }

  for (const [seed, suggestions] of allSuggestions) {
    for (const suggestion of suggestions.slice(0, 3)) {
      const redditCount = allRedditCounts.get(seed) || 0;
      const githubCount = allGitHubCounts.get(seed) || 0;

      const volumeProxy = computeVolumeProxy([suggestion], redditCount);
      const competitionProxy = computeCompetitionProxy(githubCount, 1);
      const score = scoreKeyword(volumeProxy, competitionProxy);

      const sources: string[] = ["google-autocomplete"];
      if (redditCount > 0) sources.push("reddit");

      const opportunity = KeywordOpportunitySchema.parse({
        keyword: suggestion.keyword,
        score,
        volume: volumeLabel(volumeProxy),
        competition: competitionLabel(competitionProxy),
        sources,
      });

      opportunities.push(opportunity);
    }
  }

  const sorted = opportunities
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);

  const result = {
    opportunities: sorted,
    category,
    scannedAt: new Date().toISOString(),
    totalFound: sorted.length,
  };

  setCachedRadar(cacheKey, CACHE_TTL_MS, result);

  return result;
}
