import * as p from "@clack/prompts";
import { readConfig, readBriefJson, listProjects } from "../storage/local.js";
import { colors, header, info, shortcutsHint } from "../ui/theme.js";
import { analyzeMarket } from "../analytics/marketTiming.js";
import { detectProjectCategory } from "@loopkit/shared";

export async function timingCommand(options?: {
  category?: string;
  project?: string;
}): Promise<void> {
  p.intro(colors.primary.bold("LoopKit — Market Timing Signal"));
  console.log(shortcutsHint());

  try {
    const config = readConfig();
    let category = options?.category;

    if (!category && options?.project) {
      const projects = listProjects();
      if (projects.includes(options.project)) {
        const brief = readBriefJson(options.project);
        if (brief) {
          category = detectProjectCategory(brief.mvpPlainEnglish);
        }
      }
    }

    if (!category && config?.activeProject) {
      const brief = readBriefJson(config.activeProject);
      if (brief) {
        category = detectProjectCategory(brief.mvpPlainEnglish);
      }
    }

    if (!category) {
      const input = await p.text({
        message: "Enter your category or space:",
        placeholder: "e.g. saas founders, freelance tools",
        initialValue: "general",
      });

      if (p.isCancel(input)) {
        p.outro(colors.muted("Cancelled."));
        return;
      }

      category = input;
    }

    const s = p.spinner();
    s.start(`Analyzing market signals for "${category}"...`);

    const result = await analyzeMarket(category);
    s.stop(`Market signal computed.`);

    console.log("");
    header(`Market Signal: ${category}`);
    console.log("");

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

    info(
      `${signalEmoji} Composite Score: ${signalColor(String(signal.compositeScore))}/100`,
    );
    info(`Signal: ${signalColor(signal.signal.toUpperCase())}`);
    console.log("");

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

    console.log(colors.dim("  ─────────────────────────────────"));
    console.log(
      `  ${trendArrow(signal.fundingTrend)} Funding:   ${signal.fundingCount} rounds detected`,
    );
    console.log(
      `  ${trendArrow(signal.devTrend)} Dev Activity: ${signal.devGrowth} avg stars/repos`,
    );
    console.log(
      `  ${trendArrow(signal.hiringTrend)} Hiring:     ${signal.hiringCount} postings found`,
    );
    console.log(colors.dim("  ─────────────────────────────────"));
    console.log("");

    const interpretation =
      signal.signal === "heating"
        ? "Space is heating up. More founders are entering — move fast or narrow your ICP."
        : signal.signal === "cooling"
          ? "Space is cooling down. May be saturated or past peak. Consider adjacent niches."
          : "Market is stable. Good time to enter if you have a differentiated angle.";

    info(`Interpretation: ${interpretation}`);
    console.log("");
    console.log(
      colors.dim(
        `  Last updated: ${new Date(signal.lastUpdated).toLocaleDateString()}`,
      ),
    );
  } catch (error) {
    console.log("");
    console.log(colors.danger("  Market analysis failed."));
    if (error instanceof Error) {
      console.log(colors.dim(`  ${error.message}`));
    }
  }

  p.outro(colors.muted("Stay aware. Build different."));
}
