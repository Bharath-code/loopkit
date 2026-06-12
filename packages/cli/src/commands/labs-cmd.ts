import { isLabsEnabled, setLabsEnabled, listLabsCommands } from "./labs.js";
import { readConfig, writeConfig } from "../storage/local.js";
import { clog, ceremonyOutro, ceremonyIntro, info } from "../ui/theme.js";

export async function labsCommand(action?: string): Promise<void> {
  if (!action || action === "status") {
    const enabled = isLabsEnabled();
    ceremonyIntro("Labs");
    if (enabled) {
      clog.success("Labs: ON");
    } else {
      clog.message("Labs: off");
    }
    clog.message("");
    info(`Commands behind the labs flag: ${listLabsCommands().join(", ")}`);
    info("Enable with: loopkit labs on");
    ceremonyOutro("");
    return;
  }

  if (action === "on") {
    setLabsEnabled(true);
    clog.success("Labs enabled. You can now use radar, keywords, timing, update.");
    return;
  }

  if (action === "off") {
    const config = readConfig();
    config.labsEnabled = false;
    writeConfig(config);
    clog.success("Labs disabled.");
    return;
  }

  clog.error(`Unknown action: "${action}". Use: loopkit labs [on|off|status]`);
}
