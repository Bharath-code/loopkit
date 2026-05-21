import { readConfig, readBriefJson, listProjects } from "../storage/local.js";
import {
  colors,
  header,
  info,
  pass,
  fail,
  clog,
  shortcutsHint,
  ceremonyIntro,
  ceremonyOutro,
  select,
  isCancel,
  text,
  spinner,
} from "../ui/theme.js";
import {
  scanCompetitors,
  categorizeICP,
  categorizeProblem,
} from "../analytics/competitorRadar.js";
import { pushRadarToConvex } from "../storage/sync.js";

export async function radarCommand(options?: {
  category?: string;
  project?: string;
}): Promise<void> {
  ceremonyIntro("Competitor Ship Radar");
  console.log(shortcutsHint());

  let category = options?.category;
  let problemCategory: string | undefined;

  if (!category) {
    const config = readConfig();
    const activeProject = config.activeProject;

    if (activeProject) {
      const brief = readBriefJson(activeProject);
      if (brief) {
        category = categorizeICP(brief.answers.icp);
        problemCategory = categorizeProblem(brief.answers.problem);

        clog.message(`Scanning for: ${colors.white(category)}`);
        if (problemCategory !== "other") {
          clog.message(
            colors.dim(`Problem area: ${colors.white(problemCategory)}`),
          );
        }
      }
    }

    if (!category) {
      const projects = listProjects();
      if (projects.length > 0) {
        const selected = await select({
          message: "Which project to scan for?",
          options: projects.map((slug) => {
            const brief = readBriefJson(slug);
            const label = brief ? `${brief.answers.name} (${slug})` : slug;
            return { value: slug, label };
          }),
        });

        if (isCancel(selected)) {
          ceremonyOutro("Scan cancelled.");
          return;
        }

        const brief = readBriefJson(selected as string);
        if (brief) {
          category = categorizeICP(brief.answers.icp);
          problemCategory = categorizeProblem(brief.answers.problem);
        }
      }
    }

    if (!category) {
      const input = await text({
        message:
          "Enter a category to scan (e.g., saas, ecommerce, developers):",
        placeholder: "e.g. saas founders",
      });

      if (isCancel(input)) {
        ceremonyOutro("Scan cancelled.");
        return;
      }

      category = input;
    }
  }

  const s = spinner();
  s.start(`Scanning Product Hunt & Hacker News for "${category}"...`);

  let result;
  try {
    result = await scanCompetitors(category, problemCategory);
    s.stop(`Found ${result.totalFound} relevant launches.`);

    if (result.totalFound === 0) {
      clog.message("");
      clog.message("No recent launches found in this category.");
      clog.message("Try a broader category or check back later.");
      return;
    }

    const thisWeek = result.launches.filter((l) => {
      const launchDate = new Date(l.date);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return launchDate >= weekAgo;
    });

    if (thisWeek.length > 0) {
      clog.step(`${thisWeek.length} launches this week`);
    }

    for (const launch of result.launches.slice(0, 10)) {
      const dateStr = formatDate(launch.date);
      const relevanceColor =
        launch.relevance >= 70
          ? colors.success
          : launch.relevance >= 40
            ? colors.warning
            : colors.muted;
      const platformBadge =
        launch.platform === "producthunt"
          ? colors.primary("[PH]")
          : colors.secondary("[HN]");

      clog.message(`${platformBadge} ${colors.white.bold(launch.name)}`);
      if (launch.tagline && launch.tagline !== launch.name) {
        clog.message(`  ${colors.dim(launch.tagline)}`);
      }
      clog.message(
        `  ${colors.dim(dateStr)} · ${relevanceColor(`relevance: ${launch.relevance}%`)}`,
      );
      if (launch.description) {
        clog.message(`  ${colors.dim(launch.description)}`);
      }
      if (launch.url) {
        clog.message(`  ${colors.secondary(launch.url)}`);
      }
      clog.message("");
    }

    clog.message(`Cached for 24 hours. Run again to refresh.`);
  } catch (error) {
    s.stop("Scan failed.");
    clog.error(
      "Could not fetch competitor data. Check your internet connection.",
    );
  }

  if (result) {
    try {
      await pushRadarToConvex({
        category: result.category,
        launches: result.launches.map((l) => ({
          name: l.name,
          url: l.url,
          date: l.date,
          platform: l.platform,
          relevance: l.relevance,
          description: l.description,
          tagline: l.tagline,
        })),
        scannedAt: result.scannedAt,
      });
    } catch {
      // Silently skip sync failure
    }
  }

  ceremonyOutro("Stay aware. Build different.");
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
