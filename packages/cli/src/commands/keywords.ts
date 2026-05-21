import { readConfig, readBriefJson, listProjects } from "../storage/local.js";
import { colors, clog, shortcutsHint, ceremonyIntro, ceremonyOutro, select, isCancel, text, spinner } from "../ui/theme.js";
import { findKeywords } from "../analytics/keywordFinder.js";
import { categorizeICP, categorizeProblem } from "../analytics/competitorRadar.js";

export async function keywordsCommand(options?: { category?: string; project?: string }): Promise<void> {
  ceremonyIntro("Keyword Opportunity Finder");
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

        clog.message(colors.dim(`Finding keywords for: ${colors.white(category)}`));
        if (problemCategory !== "other") {
          clog.message(colors.dim(`Problem area: ${colors.white(problemCategory)}`));
        }
      }
    }

    if (!category) {
      const projects = listProjects();
      if (projects.length > 0) {
        const selected = await select({
          message: "Which project to find keywords for?",
          options: projects.map((slug) => {
            const brief = readBriefJson(slug);
            const label = brief ? `${brief.answers.name} (${slug})` : slug;
            return { value: slug, label };
          }),
        });

        if (isCancel(selected)) {
          ceremonyOutro("Search cancelled.");
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
        message: "Enter a category (e.g., saas founders, ecommerce, developers):",
        placeholder: "e.g. saas founders",
      });

      if (isCancel(input)) {
        ceremonyOutro("Search cancelled.");
        return;
      }

      category = input;
    }
  }

  const s = spinner();
  s.start(`Scanning SEO data sources for "${category}"...`);

  try {
    const result = await findKeywords(category, problemCategory);

    if (result.totalFound === 0) {
      s.stop("No keyword opportunities found.");
      console.log("");
      clog.message("No data available for this category.");
      clog.message("Try a broader category or check back later.");
      return;
    }

    s.stop(`Found ${result.totalFound} keyword opportunities.`);
    console.log("");

    const lowHanging = result.opportunities.filter(
      (o) => o.competition === "low" && o.score >= 5
    );

    if (lowHanging.length > 0) {
      clog.step(`${lowHanging.length} low-hanging fruit`);
    }

    clog.message(colors.dim("Keyword                          Score  Volume      Competition"));
    clog.message(colors.dim("─".repeat(70)));

    for (const opp of result.opportunities.slice(0, 10)) {
      const scoreColor = opp.score >= 70 ? colors.success : opp.score >= 40 ? colors.warning : colors.muted;
      const volIcon = opp.volume === "high" ? "███" : opp.volume === "medium" ? "██░" : "█░░";
      const compColor = opp.competition === "low" ? colors.success : opp.competition === "medium" ? colors.warning : colors.danger;

      const kwDisplay = opp.keyword.length > 30 ? opp.keyword.slice(0, 27) + "..." : opp.keyword;
      const padded = kwDisplay.padEnd(32);

      clog.message(
        `${padded} ${scoreColor(String(opp.score).padStart(3))}  ${volIcon} ${opp.volume.padEnd(6)}  ${compColor(opp.competition)}`
      );

      if (opp.suggestions && opp.suggestions.length > 0) {
        clog.message(colors.dim(`  → ${opp.suggestions.slice(0, 3).join(", ")}`));
      }
    }

    clog.message("");
    clog.message("Cached for 7 days. Run again to refresh.");
  } catch (error) {
    s.stop("Search failed.");
    clog.error("Could not fetch keyword data. Check your internet connection.");
  }

  ceremonyOutro("Create content that ranks.");
}
