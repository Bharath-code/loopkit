/**
 * Sync status & retry command.
 *
 * Surfaces the health of CLI → Convex sync so users know when their
 * dashboard isn't getting data. Pre-v0.2.0, sync failures were silent
 * (logged via console.debug) which led to free-tier users wondering
 * why their dashboard was empty.
 */

import { readConfig } from "../storage/local.js";
import {
  ceremonyIntro,
  ceremonyOutro,
  clog,
  colors,
  box,
  isCancel,
  confirm,
} from "../ui/theme.js";

export interface SyncStatus {
  authenticated: boolean;
  lastAttempt: string | null;
  lastSuccess: string | null;
  failureCount: number;
  lastError: string | null;
  lastEndpoint: string | null;
  healthy: boolean;
}

const FAILURE_BANNER_THRESHOLD = 3;

export function getSyncStatus(): SyncStatus {
  const config = readConfig();
  const status = config.syncStatus;
  return {
    authenticated: !!config.auth?.apiKey,
    lastAttempt: status?.lastAttempt ?? null,
    lastSuccess: status?.lastSuccess ?? null,
    failureCount: status?.failureCount ?? 0,
    lastError: status?.lastError ?? null,
    lastEndpoint: status?.lastEndpoint ?? null,
    healthy: (status?.failureCount ?? 0) < FAILURE_BANNER_THRESHOLD,
  };
}

export function shouldShowSyncBanner(): boolean {
  return getSyncStatus().failureCount >= FAILURE_BANNER_THRESHOLD;
}

function relativeTime(iso: string | null): string {
  if (!iso) return "never";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

function renderStatusBox(status: SyncStatus): string {
  if (!status.authenticated) {
    return [
      colors.warning.bold("Not authenticated"),
      "",
      "Run `loopkit auth` to log in. Without auth, your local data",
      "is preserved but never reaches the dashboard.",
    ].join("\n");
  }

  if (status.failureCount === 0 && status.lastSuccess) {
    return [
      colors.success.bold("Healthy"),
      "",
      `${colors.muted("Last success:")} ${relativeTime(status.lastSuccess)}`,
      status.lastEndpoint ? `${colors.muted("Endpoint:")} ${status.lastEndpoint}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    status.healthy
      ? colors.warning.bold("Degraded")
      : colors.error.bold("Failing"),
    "",
    `${colors.muted("Last attempt:")} ${relativeTime(status.lastAttempt)}`,
    `${colors.muted("Last success:")} ${relativeTime(status.lastSuccess)}`,
    `${colors.muted("Failures:")} ${status.failureCount}`,
    status.lastError
      ? `${colors.muted("Last error:")} ${status.lastError}`
      : "",
    status.lastEndpoint
      ? `${colors.muted("Endpoint:")} ${status.lastEndpoint}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function syncCommand(action?: string): Promise<void> {
  ceremonyIntro("Sync");

  const status = getSyncStatus();
  console.log(box(renderStatusBox(status), "Dashboard Sync"));

  if (action === "retry") {
    if (!status.authenticated) {
      clog.error("Cannot retry: not authenticated. Run `loopkit auth`.");
      ceremonyOutro("Done.");
      return;
    }

    const wantsRetry = await confirm({
      message: "Reset failure count and re-attempt next sync?",
    });

    if (isCancel(wantsRetry) || !wantsRetry) {
      ceremonyOutro("Cancelled.");
      return;
    }

    const config = readConfig();
    config.syncStatus = {
      ...config.syncStatus,
      failureCount: 0,
      lastError: undefined,
    };
    const { writeConfig } = await import("../storage/local.js");
    writeConfig(config);
    clog.success("Failure count reset. Next sync will retry.");
    ceremonyOutro("Run `loopkit loop` or `loopkit ship` to trigger a sync.");
    return;
  }

  if (action && action !== "status") {
    clog.error(`Unknown action: "${action}". Use: loopkit sync [status|retry]`);
  } else {
    if (status.failureCount >= FAILURE_BANNER_THRESHOLD) {
      clog.warn(
        "Your dashboard isn't syncing. Run `loopkit sync retry` to clear the error state.",
      );
    }
    ceremonyOutro("Done.");
  }
}
