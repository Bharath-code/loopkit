import * as p from "@clack/prompts";
import { installAliases, removeAliases, getShellInfo } from "../aliases/installer.js";
import { clog } from "../ui/theme.js";

export async function aliasesCommand(options?: { remove?: boolean }): Promise<void> {
  if (options?.remove) {
    const removed = await removeAliases();
    if (removed) {
      clog.success("LoopKit aliases removed from your shell config.");
      clog.message("Restart your shell or run `source ~/.zshrc` to apply changes.");
    } else {
      clog.error("Failed to remove aliases or none found.");
    }
    return;
  }

  const shellInfo = getShellInfo();
  if (!shellInfo) {
    clog.error("Could not detect your shell.");
    return;
  }

  clog.info(`Shell: ${shellInfo.shell}`);
  clog.info(`Config file: ${shellInfo.configFile}`);

  const installed = await installAliases();
  if (installed) {
    clog.success("LoopKit aliases installed:");
    clog.message("  lk  → loopkit");
    clog.message("  lks → loopkit ship");
    clog.message("  lkl → loopkit loop");
    clog.message("  lkt → loopkit track");
    clog.message("Restart your shell or run `source ~/.zshrc` to apply changes.");
  } else {
    clog.warn("Aliases already installed or failed to install.");
  }
}
