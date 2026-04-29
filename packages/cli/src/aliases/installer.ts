import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const ALIASES = {
  lk: "loopkit",
  lks: "loopkit ship",
  lkl: "loopkit loop",
  lkt: "loopkit track",
};

export async function installAliases(): Promise<boolean> {
  const shell = process.env.SHELL;
  const homeDir = os.homedir();

  if (!shell) {
    console.error("Could not detect shell. SHELL environment variable not set.");
    return false;
  }

  let configFile: string;
  let shellName: string;

  if (shell.includes("zsh")) {
    configFile = path.join(homeDir, ".zshrc");
    shellName = "zsh";
  } else if (shell.includes("bash")) {
    configFile = path.join(homeDir, ".bashrc");
    // Check if .bash_profile exists on macOS
    if (process.platform === "darwin" && !fs.existsSync(configFile)) {
      configFile = path.join(homeDir, ".bash_profile");
    }
    shellName = "bash";
  } else if (shell.includes("fish")) {
    configFile = path.join(homeDir, ".config/fish/config.fish");
    shellName = "fish";
  } else {
    console.error(`Unsupported shell: ${shell}`);
    return false;
  }

  try {
    // Check if config file exists
    if (!fs.existsSync(configFile)) {
      // Ensure parent directory exists before writing
      fs.mkdirSync(path.dirname(configFile), { recursive: true });
      fs.writeFileSync(configFile, "");
    }

    const configContent = fs.readFileSync(configFile, "utf-8");
    const loopkitAliasMarker = "# LoopKit aliases";

    // Check if aliases already installed
    if (configContent.includes(loopkitAliasMarker)) {
      return false; // Already installed
    }

    // Generate alias lines
    const aliasLines: string[] = [];
    aliasLines.push("");
    aliasLines.push(loopkitAliasMarker);

    if (shellName === "fish") {
      // Fish shell uses different syntax
      for (const [alias, command] of Object.entries(ALIASES)) {
        aliasLines.push(`alias ${alias} '${command}'`);
      }
    } else {
      // Bash/Zsh
      for (const [alias, command] of Object.entries(ALIASES)) {
        aliasLines.push(`alias ${alias}='${command}'`);
      }
    }

    aliasLines.push("");

    // Append to config file
    fs.appendFileSync(configFile, aliasLines.join("\n"));

    return true;
  } catch (error) {
    console.error(`Failed to install aliases: ${error}`);
    return false;
  }
}

export async function removeAliases(): Promise<boolean> {
  const shell = process.env.SHELL;
  const homeDir = os.homedir();

  if (!shell) {
    return false;
  }

  let configFile: string;

  if (shell.includes("zsh")) {
    configFile = path.join(homeDir, ".zshrc");
  } else if (shell.includes("bash")) {
    configFile = path.join(homeDir, ".bashrc");
    if (process.platform === "darwin" && !fs.existsSync(configFile)) {
      configFile = path.join(homeDir, ".bash_profile");
    }
  } else if (shell.includes("fish")) {
    configFile = path.join(homeDir, ".config/fish/config.fish");
  } else {
    return false;
  }

  try {
    if (!fs.existsSync(configFile)) {
      return true;
    }

    const configContent = fs.readFileSync(configFile, "utf-8");
    const loopkitAliasMarker = "# LoopKit aliases";

    if (!configContent.includes(loopkitAliasMarker)) {
      return true; // No aliases to remove
    }

    // Remove LoopKit aliases section
    const lines = configContent.split("\n");
    const filtered: string[] = [];
    let inAliasSection = false;

    for (const line of lines) {
      if (line.includes(loopkitAliasMarker)) {
        inAliasSection = true;
        continue;
      }

      if (inAliasSection) {
        // Skip empty lines after marker until we hit a non-empty line
        if (line.trim() === "") {
          continue;
        }
        // Check if this line is an alias (starts with "alias" or is empty)
        if (line.trim().startsWith("alias") || line.trim() === "") {
          continue;
        }
        inAliasSection = false;
      }

      filtered.push(line);
    }

    fs.writeFileSync(configFile, filtered.join("\n"));
    return true;
  } catch (error) {
    console.error(`Failed to remove aliases: ${error}`);
    return false;
  }
}

export function getShellInfo(): { shell: string; configFile: string } | null {
  const shell = process.env.SHELL;
  const homeDir = os.homedir();

  if (!shell) {
    return null;
  }

  let configFile: string;

  if (shell.includes("zsh")) {
    configFile = path.join(homeDir, ".zshrc");
  } else if (shell.includes("bash")) {
    configFile = path.join(homeDir, ".bashrc");
    if (process.platform === "darwin" && !fs.existsSync(configFile)) {
      configFile = path.join(homeDir, ".bash_profile");
    }
  } else if (shell.includes("fish")) {
    configFile = path.join(homeDir, ".config/fish/config.fish");
  } else {
    return null;
  }

  return { shell, configFile };
}
