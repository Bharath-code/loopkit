import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { getRoot } from "./local.js";

const CACHE_DIR = "cache";
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getCacheDir(): string {
  return path.join(getRoot(), CACHE_DIR);
}

function getCachePath(hash: string): string {
  return path.join(getCacheDir(), `${hash}.json`);
}

function ensureCacheDir(): void {
  const dir = getCacheDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function hashInput(command: string, system: string, prompt: string, schemaName: string): string {
  const input = JSON.stringify({ command, system, prompt, schemaName });
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 16);
}

interface CacheEntry<T> {
  result: T;
  meta: {
    command: string;
    schema: string;
    createdAt: string;
    expiresAt: string;
  };
}

export function getCachedResult<T>(command: string, system: string, prompt: string, schemaName: string): T | null {
  const hash = hashInput(command, system, prompt, schemaName);
  const cachePath = getCachePath(hash);

  if (!fs.existsSync(cachePath)) return null;

  try {
    const entry: CacheEntry<T> = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
    const expiresAt = new Date(entry.meta.expiresAt).getTime();
    if (Date.now() > expiresAt) {
      fs.unlinkSync(cachePath);
      return null;
    }
    return entry.result;
  } catch {
    return null;
  }
}

export function setCachedResult<T>(command: string, system: string, prompt: string, schemaName: string, result: T): void {
  ensureCacheDir();
  const hash = hashInput(command, system, prompt, schemaName);
  const cachePath = getCachePath(hash);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + TTL_MS);

  const entry: CacheEntry<T> = {
    result,
    meta: {
      command,
      schema: schemaName,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    },
  };

  fs.writeFileSync(cachePath, JSON.stringify(entry, null, 2));
}

export function clearAllCache(): number {
  const dir = getCacheDir();
  if (!fs.existsSync(dir)) return 0;

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    fs.unlinkSync(path.join(dir, file));
  }
  return files.length;
}

export function getCacheStats(): { count: number; sizeBytes: number } {
  const dir = getCacheDir();
  if (!fs.existsSync(dir)) return { count: 0, sizeBytes: 0 };

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  let totalSize = 0;
  for (const file of files) {
    try {
      totalSize += fs.statSync(path.join(dir, file)).size;
    } catch {
      // ignore
    }
  }
  return { count: files.length, sizeBytes: totalSize };
}

// ─── Radar-specific cache (key-based, not hash-based) ────────────

function getRadarCachePath(key: string): string {
  return path.join(getCacheDir(), `radar-${key}.json`);
}

interface RadarCacheEntry<T> {
  result: T;
  scannedAt: string;
  expiresAt: string;
}

export function getCachedRadar<T>(key: string, ttlMs: number): T | null {
  const cachePath = getRadarCachePath(key);
  if (!fs.existsSync(cachePath)) return null;

  try {
    const entry: RadarCacheEntry<T> = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
    if (Date.now() > new Date(entry.expiresAt).getTime()) {
      fs.unlinkSync(cachePath);
      return null;
    }
    return entry.result;
  } catch {
    return null;
  }
}

export function setCachedRadar<T>(key: string, ttlMs: number, result: T): void {
  ensureCacheDir();
  const cachePath = getRadarCachePath(key);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs);

  const entry: RadarCacheEntry<T> = {
    result,
    scannedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  fs.writeFileSync(cachePath, JSON.stringify(entry, null, 2));
}

export function clearExpiredCache(): number {
  const dir = getCacheDir();
  if (!fs.existsSync(dir)) return 0;

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  let cleared = 0;
  for (const file of files) {
    const cachePath = path.join(dir, file);
    try {
      const entry = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
      if (entry.meta?.expiresAt && Date.now() > new Date(entry.meta.expiresAt).getTime()) {
        fs.unlinkSync(cachePath);
        cleared++;
      } else if (entry.expiresAt && Date.now() > new Date(entry.expiresAt).getTime()) {
        fs.unlinkSync(cachePath);
        cleared++;
      }
    } catch {
      // corrupt file, remove it
      fs.unlinkSync(cachePath);
      cleared++;
    }
  }
  return cleared;
}
