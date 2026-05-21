import { Command } from "commander";
import { colors, ceremonyIntro, ceremonyOutro, spinner, note, password, isCancel, clog } from "../ui/theme.js";
import { readConfig, writeConfig } from "../storage/local";

export const authCommand = new Command("auth")
  .description("Authenticate LoopKit CLI with your web account")
  .option("--key", "Enter API key directly (no browser)")
  .action(async (options?: { key?: boolean }) => {
    console.clear();
    ceremonyIntro("Auth");

    if (options?.key) {
      const apiKey = await password({ message: "Paste your Anthropic API key:" });
      if (isCancel(apiKey)) { ceremonyOutro("Cancelled."); return; }
      const config = readConfig();
      config.auth = { apiKey: apiKey as string };
      writeConfig(config);
      clog.success("API key saved. You're ready to ship.");
      ceremonyOutro("Authenticated.");
      return;
    }

    try {
      const s = spinner();
      s.start("Generating authentication session");

      const API_URL = process.env.LOOPKIT_API_URL || "http://localhost:3000";
      
      const res = await fetch(`${API_URL}/api/cli/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" })
      });

      if (!res.ok) {
        throw new Error("Failed to create session");
      }

      const { code } = await res.json();
      s.stop("Session generated");

      note(
        `Open the following URL in your browser:\n\n${colors.primary(`${API_URL}/cli-auth?code=${code}`)}`,
        "Action Required"
      );

      s.start("Waiting for browser authentication");

      // Polling for completion
      let token: string | undefined;
      for (let i = 0; i < 60; i++) { // Wait up to 2 minutes (60 * 2s)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const pollRes = await fetch(`${API_URL}/api/cli/auth`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "poll", code })
        });

        if (pollRes.ok) {
          const data = await pollRes.json();
          if (data.status === "completed" && data.token) {
            token = data.token;
            break;
          }
        }
      }

      if (!token) {
        s.stop("Authentication timed out.");
        ceremonyOutro("Authentication timed out. Please try running loopkit auth again.");
        process.exit(1);
      }

      s.stop("Authenticated successfully!");

      // Save to config
      const config = readConfig();
      config.auth = { apiKey: token };
      writeConfig(config);

      ceremonyOutro("You are now logged in and ready to ship.");

    } catch (err) {
      ceremonyOutro(`Authentication failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      process.exit(1);
    }
  });
