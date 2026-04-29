import * as p from "@clack/prompts";
import { readConfig, readTasksFile } from "../storage/local.js";
import { colors, box } from "../ui/theme.js";
import { sendTerminalNotification } from "../notifications/terminal.js";

export async function remindFridayCommand(): Promise<void> {
  const config = readConfig();
  const slug = config.activeProject;

  if (!slug) {
    console.log(colors.danger("No active project. Run `loopkit init` first."));
    process.exit(1);
  }

  const tasksContent = readTasksFile(slug);
  let openTasks = 0;

  if (tasksContent) {
    const lines = tasksContent.split("\n");
    for (const line of lines) {
      if (/^\s*-\s*\[ \]/.test(line)) {
        openTasks++;
      }
    }
  }

  const message = `
📦  Friday Check — LoopKit

  You have ${openTasks} open task${openTasks === 1 ? '' : 's'} and haven't run \`ship\` yet.
  Founders who ship on Fridays are 3× more likely to have paying customers by month 2.

  → loopkit ship
`;

  console.log(box(message.trim()));

  // Send terminal notification
  await sendTerminalNotification({
    title: "📦 Friday Check — LoopKit",
    message: `${openTasks} open tasks. Ship today for 3× better odds of revenue.`,
  });

  // Note: Interactive prompts removed for cron job compatibility
  // Users can manually run `loopkit ship` when ready
}
