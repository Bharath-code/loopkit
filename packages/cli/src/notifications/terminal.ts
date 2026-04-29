import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface NotificationOptions {
  title: string;
  message: string;
}

export async function sendTerminalNotification(
  options: NotificationOptions,
): Promise<boolean> {
  const platform = process.platform;
  const { title, message } = options;

  try {
    if (platform === "darwin") {
      // macOS: use terminal-notifier with proper escaping
      const escapedTitle = title.replace(/"/g, '\\"');
      const escapedMessage = message.replace(/"/g, '\\"');
      await execAsync(
        `terminal-notifier -title "${escapedTitle}" -message "${escapedMessage}" -sound default`,
      );
      return true;
    } else if (platform === "linux") {
      // Linux: use notify-send with proper escaping
      const escapedTitle = title.replace(/"/g, '\\"');
      const escapedMessage = message.replace(/"/g, '\\"');
      await execAsync(`notify-send "${escapedTitle}" "${escapedMessage}"`);
      return true;
    } else if (platform === "win32") {
      // Windows: use powershell toast notification
      const escapedMessage = message.replace(/"/g, '\\"');
      const escapedTitle = title.replace(/"/g, '\\"');
      await execAsync(
        `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('${escapedMessage}', '${escapedTitle}')"`,
      );
      return true;
    }
    return false;
  } catch (error) {
    console.error("Failed to send notification:", error);
    return false;
  }
}

export async function checkNotificationSupport(): Promise<boolean> {
  const platform = process.platform;

  try {
    if (platform === "darwin") {
      await execAsync("which terminal-notifier");
      return true;
    } else if (platform === "linux") {
      await execAsync("which notify-send");
      return true;
    } else if (platform === "win32") {
      // Windows always has PowerShell
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
