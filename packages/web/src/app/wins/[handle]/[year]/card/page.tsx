/**
 * /wins/[handle]/[year]/card — Sharable annual card.
 *
 * Server-rendered, optimized for screenshot. A founder opens this URL,
 * screenshots it (or uses Cmd+S → save as PDF in print mode), and posts
 * the result on Twitter / LinkedIn.
 *
 * The page is a self-contained 1200×630-ish hero — no nav, no footer.
 * Uses inline styles + Google Fonts so the page renders identically
 * across viewports and screenshot tools.
 */

import { notFound } from "next/navigation";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../../convex/_generated/api";

const CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL || "";

interface PublicWin {
  _id: string;
  productName: string;
  weekNum: number;
  shippingScore: number;
  streak: number;
  tasksCompleted: number;
  tasksTotal: number;
  feedbackCount: number;
  loopkitScore: number | null;
  mrr: number | null;
  oneThing: string;
  createdAt: number;
  handle: string;
}

interface AnnualData {
  productName: string;
  weeks: Array<{
    week: number;
    score: number;
    shipped: boolean;
  }>;
  averageScore: number;
  totalShips: number;
  totalTasks: number;
  longestStreak: number;
  hasRevenue: boolean;
  mrr: number | null;
}

const ARCHETYPE_EMOJI: Record<string, string> = {
  Marathoner: "🏃",
  Sprinter: "⚡",
  Perfectionist: "🎯",
  Reactor: "🌊",
  "All-Star": "🌟",
};

async function fetchAnnualData(handle: string, year: number): Promise<AnnualData | null> {
  if (!CONVEX_URL) return null;
  try {
    const client = new ConvexHttpClient(CONVEX_URL);
    const wins = (await client.query(api.milestones.listPublicWins, {
      limit: 200,
    })) as PublicWin[];

    const matching = wins
      .filter(
        (w) =>
          w.handle.toLowerCase() === handle.toLowerCase() &&
          new Date(w.createdAt).getFullYear() === year,
      )
      .sort((a, b) => a.weekNum - b.weekNum);

    if (matching.length === 0) return null;

    const totalShips = matching.length;
    const totalTasks = matching.reduce((s, w) => s + w.tasksCompleted, 0);
    const averageScore = Math.round(
      matching.reduce((s, w) => s + w.shippingScore, 0) / matching.length,
    );

    // Longest streak of consecutive weeks with score > 0
    let longestStreak = 0;
    let run = 0;
    let prevWeek: number | null = null;
    for (const w of matching) {
      if (w.shippingScore === 0) {
        run = 0;
        continue;
      }
      if (prevWeek !== null && w.weekNum === prevWeek + 1) {
        run++;
      } else {
        run = 1;
      }
      if (run > longestStreak) longestStreak = run;
      prevWeek = w.weekNum;
    }

    const lastWin = matching[matching.length - 1];
    const hasRevenue = (lastWin.mrr ?? 0) > 0;

    return {
      productName: lastWin.productName,
      weeks: matching.map((w) => ({
        week: w.weekNum,
        score: w.shippingScore,
        shipped: true, // publicWins are only posted when shipped
      })),
      averageScore,
      totalShips,
      totalTasks,
      longestStreak,
      hasRevenue,
      mrr: lastWin.mrr ?? null,
    };
  } catch (err) {
    console.error("Failed to load annual data:", err);
    return null;
  }
}

function scoreBlock(score: number): string {
  if (score >= 80) return "█";
  if (score >= 60) return "▓";
  if (score >= 40) return "▒";
  if (score > 0) return "░";
  return "·";
}

function scoreColor(score: number): string {
  if (score >= 80) return "#10b981"; // emerald
  if (score >= 60) return "#06b6D4"; // cyan
  if (score >= 40) return "#f59e0b"; // amber
  if (score > 0) return "#71717a"; // zinc-500
  return "#27272a"; // zinc-800
}

function inferArchetype(weeks: AnnualData["weeks"]): { name: string; emoji: string } {
  if (weeks.length < 4) return { name: "Founder", emoji: "📊" };
  const recent = weeks.slice(-8);
  const avg =
    recent.reduce((s, w) => s + w.score, 0) / Math.max(recent.length, 1);
  const longestStreak = weeks.reduce((m, _w, i) => {
    let r = 0;
    for (let j = i; j < weeks.length; j++) {
      if (weeks[j].week === weeks[i].week + (j - i)) r++;
      else break;
    }
    return Math.max(m, r);
  }, 0);
  if (avg >= 85 && longestStreak >= 4) return { name: "All-Star", emoji: "🌟" };
  if (longestStreak >= 6) return { name: "Marathoner", emoji: "🏃" };
  if (avg >= 70) return { name: "Perfectionist", emoji: "🎯" };
  if (longestStreak <= 3) return { name: "Sprinter", emoji: "⚡" };
  return { name: "Founder", emoji: "📊" };
}

export async function generateMetadata({
  params,
}: {
  params: { handle: string; year: string };
}) {
  return {
    title: `@${params.handle} — ${params.year} Year in Review · LoopKit`,
    description: `${params.handle}'s shipping year on LoopKit. ${params.year} recap.`,
  };
}

export default async function AnnualCardPage({
  params,
}: {
  params: { handle: string; year: string };
}) {
  const year = parseInt(params.year, 10);
  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    notFound();
  }

  const data = await fetchAnnualData(params.handle, year);
  if (!data) {
    notFound();
  }

  const archetype = inferArchetype(data.weeks);
  const ROWS = 4;
  const COLS = 13;
  const heatmap: number[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => 0),
  );
  for (let i = 0; i < data.weeks.length && i < ROWS * COLS; i++) {
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    heatmap[row][col] = data.weeks[i].score;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #09090b 0%, #0c0c0f 100%)",
        color: "#fafafa",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
      }}
    >
      <article
        style={{
          width: "100%",
          maxWidth: 1100,
          background:
            "linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(6,182,212,0.04) 100%)",
          border: "1px solid rgba(63,63,70,0.4)",
          borderRadius: 24,
          padding: 48,
          boxShadow: "0 25px 80px -20px rgba(124,58,237,0.15)",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 32,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 14,
                color: "#a1a1aa",
                fontFamily: "ui-monospace, monospace",
                marginBottom: 4,
              }}
            >
              @{params.handle}
            </div>
            <h1
              style={{
                fontSize: 48,
                fontWeight: 700,
                lineHeight: 1.05,
                margin: 0,
                background:
                  "linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {year}
            </h1>
            <p
              style={{
                fontSize: 16,
                color: "#a1a1aa",
                margin: "8px 0 0 0",
              }}
            >
              Year in Review
            </p>
          </div>
          <div
            style={{
              textAlign: "right",
              padding: "16px 20px",
              borderRadius: 12,
              background: "rgba(24,24,27,0.5)",
              border: "1px solid rgba(63,63,70,0.4)",
            }}
          >
            <div style={{ fontSize: 36, lineHeight: 1 }}>{archetype.emoji}</div>
            <div
              style={{
                fontSize: 14,
                color: "#d4d4d8",
                fontWeight: 600,
                marginTop: 4,
              }}
            >
              {archetype.name}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#71717a",
                marginTop: 2,
              }}
            >
              Shipping DNA
            </div>
          </div>
        </header>

        {/* Heatmap */}
        <section style={{ marginBottom: 32 }}>
          <h2
            style={{
              fontSize: 13,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#71717a",
              margin: "0 0 12px 0",
              fontWeight: 600,
            }}
          >
            Weekly shipping scores
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateRows: `repeat(${ROWS}, 1fr)`,
              gap: 6,
              fontFamily: "ui-monospace, monospace",
              fontSize: 28,
              lineHeight: 1,
            }}
          >
            {heatmap.map((row, ri) => (
              <div
                key={ri}
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                  gap: 6,
                }}
              >
                {row.map((score, ci) => (
                  <div
                    key={ci}
                    style={{
                      textAlign: "center",
                      color: scoreColor(score),
                    }}
                  >
                    {scoreBlock(score)}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 12,
              fontSize: 11,
              color: "#52525b",
              fontFamily: "ui-monospace, monospace",
              textAlign: "center",
            }}
          >
            · = no ship&nbsp;&nbsp;░ = under 40&nbsp;&nbsp;▒ = under 60&nbsp;&nbsp;▓ = under 80&nbsp;&nbsp;█ = 80+
          </div>
        </section>

        {/* Stats */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <Stat label="Avg score" value={`${data.averageScore}%`} accent="#7C3AED" />
          <Stat label="Ships" value={String(data.totalShips)} accent="#06B6D4" />
          <Stat label="Longest streak" value={`${data.longestStreak}w`} accent="#F97316" />
          <Stat
            label={data.hasRevenue ? "MRR" : "Tasks done"}
            value={
              data.hasRevenue && data.mrr
                ? `$${data.mrr}/mo`
                : String(data.totalTasks)
            }
            accent="#10B981"
          />
        </section>

        {/* Footer */}
        <footer
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 24,
            borderTop: "1px solid rgba(63,63,70,0.4)",
            fontSize: 12,
            color: "#71717a",
          }}
        >
          <div>
            Built with{" "}
            <span style={{ color: "#a78bfa", fontWeight: 600 }}>LoopKit</span> ·
            the CLI for solo founders shipping weekly
          </div>
          <div style={{ fontFamily: "ui-monospace, monospace" }}>
            loopkit.dev/wins/@{params.handle}/{year}
          </div>
        </footer>
      </article>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 12,
        background: "rgba(24,24,27,0.5)",
        border: "1px solid rgba(63,63,70,0.4)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "#71717a",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: accent,
          marginTop: 4,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
    </div>
  );
}
