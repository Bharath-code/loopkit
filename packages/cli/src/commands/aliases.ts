import * as p from "@clack/prompts";
import { installAliases, removeAliases, getShellInfo } from "../aliases/installer.js";
import { colors, info } from "../ui/theme.js";

export async function aliasesCommand(options?: { remove?: boolean }): Promise<void> {
  if (options?.remove) {
    const removed = await removeAliases();
    if (removed) {
      console.log(info("LoopKit aliases removed from your shell config."));
      console.log(colors.dim("Restart your shell or run `source ~/.zshrc` to apply changes."));
    } else {
      console.log(colors.danger("Failed to remove aliases or none found."));
    }
    return;
  }

  const shellInfo = getShellInfo();
  if (!shellInfo) {
    console.log(colors.danger("Could not detect your shell."));
    return;
  }

  console.log(info(`Shell: ${shellInfo.shell}`));
  console.log(info(`Config file: ${shellInfo.configFile}`));

  const installed = await installAliases();
  if (installed) {
    console.log(info("LoopKit aliases installed:"));
    console.log(colors.dim("  lk  → loopkit"));
    console.log(colors.dim("  lks → loopkit ship"));
    console.log(colors.dim("  lkl → loopkit loop"));
    console.log(colors.dim("  lkt → loopkit track"));
    console.log(colors.muted("\nRestart your shell or run `source ~/.zshrc` to apply changes."));
  } else {
    console.log(colors.warning("Aliases already installed or failed to install."));
  }
}
