import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const execAsync = promisify(exec);

const FRIDAY_REMINDER_CRON = "0 16 * * 5"; // Friday 4:00 PM
const LOOPKIT_PATH = process.env.LOOPKIT_PATH || "loopkit";
const REMINDER_COMMAND = `${LOOPKIT_PATH} remind:friday`;

export async function installFridayReminder(): Promise<boolean> {
  try {
    // Check if already installed
    const existing = await checkExistingCron();
    if (existing && existing.includes(REMINDER_COMMAND)) {
      return false; // Already installed
    }

    // Get current crontab
    let currentCron = "";
    try {
      const { stdout } = await execAsync("crontab -l");
      currentCron = stdout;
    } catch {
      // No crontab exists yet, that's fine
      currentCron = "";
    }

    // Add the Friday reminder
    const newEntry = `${FRIDAY_REMINDER_CRON} ${REMINDER_COMMAND}\n`;
    const updatedCron = currentCron + newEntry;

    // Write to temporary file and install
    const tempFile = path.join(os.tmpdir(), "crontab-loopkit");
    fs.writeFileSync(tempFile, updatedCron);
    await execAsync(`crontab ${tempFile}`);
    fs.unlinkSync(tempFile);

    return true;
  } catch (error) {
    console.error("Failed to install cron job:", error);
    return false;
  }
}

export async function removeFridayReminder(): Promise<boolean> {
  try {
    const currentCron = await checkExistingCron();
    if (!currentCron) return true; // Nothing to remove

    // Remove the Friday reminder line
    const lines = currentCron.split("\n");
    const filtered = lines.filter(line => !line.includes(REMINDER_COMMAND));
    const updatedCron = filtered.join("\n");

    // Write to temporary file and install
    const tempFile = path.join(os.tmpdir(), "crontab-loopkit");
    fs.writeFileSync(tempFile, updatedCron);
    await execAsync(`crontab ${tempFile}`);
    fs.unlinkSync(tempFile);

    return true;
  } catch (error) {
    console.error("Failed to remove cron job:", error);
    return false;
  }
}

async function checkExistingCron(): Promise<string | null> {
  try {
    const { stdout } = await execAsync("crontab -l");
    return stdout;
  } catch {
    return null;
  }
}

export function getReminderMessage(openTasks: number): string {
  return `
📦  Friday Check — LoopKit

  You have ${openTasks} open task${openTasks === 1 ? '' : 's'} and haven't run \`ship\` yet.
  Founders who ship on Fridays are 3× more likely to have paying customers by month 2.

  → loopkit ship
`;
}
