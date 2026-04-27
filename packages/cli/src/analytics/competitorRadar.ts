import { type CompetitorLaunch, CompetitorLaunchSchema } from "@loopkit/shared";
import { getCachedRadar, setCachedRadar } from "../storage/cache.js";
import { log } from "./logger.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KEYWORDS_FILE = path.join(__dirname, "keywords.json");

interface KeywordsConfig {
  version: number;
  categoryKeywords: Record<string, string[]>;
  problemKeywords: Record<string, string[]>;
}

let _keywordsCache: KeywordsConfig | null = null;

function loadKeywords(): KeywordsConfig {
  if (_keywordsCache) return _keywordsCache;

  try {
    const raw = fs.readFileSync(KEYWORDS_FILE, "utf-8");
    _keywordsCache = JSON.parse(raw) as KeywordsConfig;
    return _keywordsCache;
  } catch {
    _keywordsCache = {
      version: 1,
      categoryKeywords: {
        "freelancers": ["freelance", "contractor", "gig economy", "upwork", "fiverr"],
        "saas founders": ["saas", "startup", "founder", "no-code", "indie hacker"],
        "creators": ["creator", "influencer", "content creator", "youtube", "podcast"],
        "ecommerce": ["ecommerce", "shopify", "d2c", "online store", "retail"],
        "developers": ["developer tools", "devtools", "api", "sdk", "cli"],
        "students": ["education", "learning", "student", "course", "e-learning"],
        "health & wellness": ["health", "fitness", "wellness", "meditation", "mental health"],
        "finance": ["fintech", "finance", "crypto", "investing", "trading"],
        "marketers": ["marketing", "seo", "growth", "email marketing", "social media"],
        "general": ["tool", "productivity", "automation", "workflow"],
      },
      problemKeywords: {
        "proposal creation": ["proposal", "pitch deck", "presentation", "bid"],
        "email outreach": ["cold email", "outreach", "follow-up", "email sequence"],
        "content creation": ["content", "writing", "blog", "social media", "copywriting"],
        "scheduling": ["scheduling", "calendar", "booking", "meeting"],
        "billing & payments": ["invoic", "billing", "payment", "subscription"],
        "analytics": ["analytics", "tracking", "metrics", "dashboard", "reporting"],
        "customer management": ["crm", "customer", "lead", "pipeline", "sales"],
        "workflow automation": ["automation", "workflow", "zapier", "integration"],
        "hiring & recruiting": ["hiring", "recruiting", "talent", "job posting"],
        "other": ["tool", "app", "platform", "software"],
      },
    };
    return _keywordsCache;
  }
}

export function getSearchKeywords(category: string): string[] {
  const config = loadKeywords();
  return config.categoryKeywords[category] || config.categoryKeywords["general"];
}

export function getProblemKeywords(problemCategory: string): string[] {
  const config = loadKeywords();
  return config.problemKeywords[problemCategory] || config.problemKeywords["other"];
}

interface PHRSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

interface HNHit {
  title: string;
  url: string;
  created_at: string;
  points: number;
  num_comments: number;
  objectID: string;
}

function parseRSSItems(xml: string): PHRSSItem[] {
  const items: PHRSSItem[] = [];
  let inItem = false;
  let currentTag = "";
  let currentText = "";
  let currentItem: Partial<PHRSSItem> = {};

  for (let i = 0; i < xml.length; i++) {
    if (xml[i] === "<") {
      const closeIdx = xml.indexOf(">", i);
      if (closeIdx === -1) break;

      const tagContent = xml.slice(i + 1, closeIdx);
      const isClosing = tagContent.startsWith("/");
      const tagName = tagContent.replace(/^\/?\s*/, "").split(/[\s/>]/)[0].toLowerCase();

      if (tagName === "item" && !isClosing) {
        inItem = true;
        currentItem = {};
        currentTag = "";
        currentText = "";
      } else if (tagName === "item" && isClosing) {
        inItem = false;
        if (currentItem.title && currentItem.link) {
          items.push({
            title: currentItem.title || "",
            link: currentItem.link || "",
            description: currentItem.description || "",
            pubDate: currentItem.pubDate || new Date().toISOString(),
          });
        }
      } else if (inItem && !isClosing && ["title", "link", "description", "pubdate"].includes(tagName)) {
        currentTag = tagName;
        currentText = "";
      } else if (inItem && isClosing && currentTag === tagName) {
        (currentItem as Record<string, string>)[currentTag] = currentText.trim();
        currentTag = "";
        currentText = "";
      }

      i = closeIdx;
    } else if (inItem && currentTag) {
      currentText += xml[i];
    }
  }

  return items;
}

function sanitizeText(text: string): string {
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .slice(0, 500);
}

function cleanTitle(title: string): string {
  return title.replace(/\s*[-–—|]\s*Product Hunt$/, "").trim();
}

function computeRelevance(item: { title: string; description: string }, keywords: string[]): number {
  const text = `${item.title} ${item.description}`.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (text.includes(kw.toLowerCase())) score += 25;
  }
  return Math.min(score, 100);
}

async function fetchProductHuntRSS(keywords: string[]): Promise<CompetitorLaunch[]> {
  try {
    const response = await fetch("https://www.producthunt.com/rss", {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return [];

    const text = await response.text();
    const items = parseRSSItems(text);

    return items
      .map((item) => {
        const relevance = computeRelevance(item, keywords);
        if (relevance < 20) return null;

        return CompetitorLaunchSchema.parse({
          name: sanitizeText(cleanTitle(item.title)),
          url: sanitizeText(item.link),
          date: item.pubDate,
          platform: "producthunt" as const,
          relevance,
          description: sanitizeText(item.description?.slice(0, 200) || ""),
          tagline: sanitizeText(item.title),
        });
      })
      .filter((l): l is CompetitorLaunch => l !== null)
      .slice(0, 10);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (err.name !== "AbortError") {
      log("error", "competitorRadar", "Product Hunt fetch failed", {
        error: err.message,
        stack: err.stack?.split("\n")[0],
      });
    }
    return [];
  }
}

async function fetchHackerNews(keywords: string[]): Promise<CompetitorLaunch[]> {
  try {
    const queries = keywords.slice(0, 3);

    const fetchPromises = queries.map(async (query) => {
      const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&numericFilters=points>5&hitsPerPage=10`;
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        const data = await response.json();
        return data.hits || [];
      }
      return [];
    });

    const results = await Promise.all(fetchPromises);
    const allHits: HNHit[] = results.flat();

    const seen = new Set<string>();
    return allHits
      .filter((hit) => {
        if (!hit.title || !hit.url) return false;
        if (seen.has(hit.url)) return false;
        seen.add(hit.url);
        return true;
      })
      .map((hit) => {
        const relevance = computeRelevance(
          { title: hit.title, description: "", link: hit.url, pubDate: hit.created_at },
          keywords
        );
        if (relevance < 20) return null;

        return CompetitorLaunchSchema.parse({
          name: sanitizeText(cleanTitle(hit.title)),
          url: sanitizeText(hit.url),
          date: hit.created_at,
          platform: "hackernews" as const,
          relevance: Math.min(relevance + Math.min(hit.points, 30), 100),
          description: sanitizeText(`${hit.points} points · ${hit.num_comments} comments`),
          tagline: sanitizeText(hit.title),
        });
      })
      .filter((l): l is CompetitorLaunch => l !== null)
      .slice(0, 10);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (err.name !== "AbortError") {
      log("error", "competitorRadar", "Hacker News fetch failed", {
        error: err.message,
        stack: err.stack?.split("\n")[0],
      });
    }
    return [];
  }
}

export async function scanCompetitors(category: string, problemCategory?: string): Promise<{
  launches: CompetitorLaunch[];
  category: string;
  scannedAt: string;
  totalFound: number;
}> {
  const cacheKey = `${category}:${problemCategory || ""}`;

  const cached = getCachedRadar(cacheKey, CACHE_TTL_MS);

  if (cached) {
    return cached as {
      launches: CompetitorLaunch[];
      category: string;
      scannedAt: string;
      totalFound: number;
    };
  }

  const keywords = getSearchKeywords(category);
  if (problemCategory) {
    keywords.push(...getProblemKeywords(problemCategory));
  }

  const [phLaunches, hnLaunches] = await Promise.all([
    fetchProductHuntRSS(keywords),
    fetchHackerNews(keywords),
  ]);

  const allLaunches = [...phLaunches, ...hnLaunches]
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return b.relevance - a.relevance;
    })
    .slice(0, 15);

  const result = {
    launches: allLaunches,
    category,
    scannedAt: new Date().toISOString(),
    totalFound: allLaunches.length,
  };

  setCachedRadar(cacheKey, CACHE_TTL_MS, result);

  return result;
}

export function categorizeICP(icp: string): string {
  const lower = icp.toLowerCase();
  if (/freelance|contractor|consultant|agency/.test(lower)) return "freelancers";
  if (/saas|startup|founder|ceo|cto/.test(lower)) return "saas founders";
  if (/creator|influencer|youtuber|podcaster|writer/.test(lower)) return "creators";
  if (/ecommerce|shopify|d2c|retail|store/.test(lower)) return "ecommerce";
  if (/developer|engineer|programmer|devops/.test(lower)) return "developers";
  if (/student|education|learning|course/.test(lower)) return "students";
  if (/health|fitness|wellness|medical/.test(lower)) return "health & wellness";
  if (/finance|investor|trading|crypto/.test(lower)) return "finance";
  if (/marketer|seo|growth|sales/.test(lower)) return "marketers";
  return "general";
}

export function categorizeProblem(problem: string): string {
  const lower = problem.toLowerCase();
  if (/proposal|pitch|presentation|deck/.test(lower)) return "proposal creation";
  if (/email|outreach|cold|follow.?up/.test(lower)) return "email outreach";
  if (/content|writing|blog|social|post/.test(lower)) return "content creation";
  if (/scheduling|calendar|booking|meeting/.test(lower)) return "scheduling";
  if (/invoic|billing|payment|pricing/.test(lower)) return "billing & payments";
  if (/analytics|tracking|metrics|dashboard/.test(lower)) return "analytics";
  if (/crm|customer|lead|pipeline/.test(lower)) return "customer management";
  if (/automation|workflow|process|repetitive/.test(lower)) return "workflow automation";
  if (/hiring|recruiting|team|staff/.test(lower)) return "hiring & recruiting";
  return "other";
}

export function categorizeMVP(mvp: string): string {
  const lower = mvp.toLowerCase();
  if (/web app|saas|platform|dashboard/.test(lower)) return "web app";
  if (/mobile|ios|android|app/.test(lower)) return "mobile app";
  if (/chrome|browser|browser extension|browser plugin/.test(lower)) return "browser extension";
  if (/api|integration|plugin/.test(lower)) return "api/plugin";
  if (/cli|command|terminal|tool/.test(lower)) return "cli tool";
  if (/newsletter|email|content|blog/.test(lower)) return "content/newsletter";
  if (/service|consulting|agency|done.for.you/.test(lower)) return "service";
  return "other";
}
