import { readConfig, readBriefJson, listProjects } from "../storage/local.js";
import { colors, header, info, shortcutsHint, ceremonyIntro, ceremonyOutro, text, isCancel, spinner, clog } from "../ui/theme.js";
import { analyzeMarket } from "../analytics/marketTiming.js";
import { detectProjectCategory } from "@loopkit/shared";
import { pushTimingToConvex } from "../storage/sync.js";
import { labsGate } from "./labs.js";

export async function timingCommand(options?: {
  category?: string;
  project?: string;
}): Promise<void> {
  if (!labsGate("timing")) return;

  ceremonyIntro("Market Timing Signal");
  console.log(shortcutsHint());

  try {
    const config = readConfig();
    let category = options?.category;

    if (!category && options?.project) {
      const projects = listProjects();
      if (projects.includes(options.project)) {
        const brief = readBriefJson(options.project);
        if (brief?.brief) {
          category = detectProjectCategory(brief.brief.mvpPlainEnglish);
        }
      }
    }

    if (!category && config?.activeProject) {
      const brief = readBriefJson(config.activeProject);
      if (brief?.brief) {
        category = detectProjectCategory(brief.brief.mvpPlainEnglish);
      }
    }

    if (!category) {
      const input = await text({
        message: "Enter your category or space:",
        placeholder: "e.g. saas founders, freelance tools",
        initialValue: "general",
      });

      if (isCancel(input)) {
        ceremonyOutro("Cancelled.");
        return;
      }

      category = input;
    }

    const s = spinner();
    s.start(`Analyzing market signals for "${category}"...`);

    const result = await analyzeMarket(category);
    s.stop(`Market signal computed.`);

    const { signal } = result;

    const signalEmoji =
      signal.signal === "heating"
        ? "🔥"
        : signal.signal === "cooling"
          ? "❄️"
          : "⚖️";
    const signalColor =
      signal.signal === "heating"
        ? colors.success
        : signal.signal === "cooling"
          ? colors.danger
          : colors.warning;

    clog.step(`Market Signal: ${category}`);
    clog.info(`${signalEmoji} Composite Score: ${signalColor(String(signal.compositeScore))}/100`);
    clog.info(`Signal: ${signalColor(signal.signal.toUpperCase())}`);

    const trendArrow = (trend: string) => {
      switch (trend) {
        case "up":
          return colors.success("↑");
        case "down":
          return colors.danger("↓");
        default:
          return colors.muted("→");
      }
    };

    clog.message(colors.dim("─────────────────────────────────"));
    clog.message(
      `${trendArrow(signal.fundingTrend)} Funding:   ${signal.fundingCount} rounds detected`,
    );
    clog.message(
      `${trendArrow(signal.devTrend)} Dev Activity: ${signal.devGrowth} avg stars/repos`,
    );
    clog.message(
      `${trendArrow(signal.hiringTrend)} Hiring:     ${signal.hiringCount} postings found`,
    );
    clog.message(colors.dim("─────────────────────────────────"));

    const interpretation =
      signal.signal === "heating"
        ? "Space is heating up. More founders are entering — move fast or narrow your ICP."
        : signal.signal === "cooling"
          ? "Space is cooling down. May be saturated or past peak. Consider adjacent niches."
          : "Market is stable. Good time to enter if you have a differentiated angle.";

    clog.message(`Interpretation: ${interpretation}`);
    clog.message(colors.dim(`Last updated: ${new Date(signal.lastUpdated).toLocaleDateString()}`));

    try {
      await pushTimingToConvex({
        category: signal.category,
        fundingTrend: signal.fundingTrend,
        fundingCount: signal.fundingCount,
        devTrend: signal.devTrend,
        devGrowth: signal.devGrowth,
        hiringTrend: signal.hiringTrend,
        hiringCount: signal.hiringCount,
        compositeScore: signal.compositeScore,
        signal: signal.signal,
      });
    } catch {
      // Silently skip sync failure
    }
  } catch (error) {
    clog.error("Market analysis failed.");
    if (error instanceof Error) {
      clog.message(colors.dim(`  ${error.message}`));
    }
  }

  ceremonyOutro("Stay aware. Build different.");
}
