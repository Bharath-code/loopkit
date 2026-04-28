import type { TerminalLine } from "./state";

let lineId = 0;
export function nextLineId(): number {
  return ++lineId;
}

export function line(
  text: string,
  color: string = "text-zinc-300",
): TerminalLine {
  return { id: nextLineId(), text, color };
}

export function blank(): TerminalLine {
  return { id: nextLineId(), text: "", color: "" };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function typeLines(
  lines: TerminalLine[],
  addLine: (l: TerminalLine) => void,
  delay: number = 40,
): Promise<void> {
  for (const l of lines) {
    addLine(l);
    await sleep(delay);
  }
}

export async function showSpinner(
  text: string,
  addLine: (l: TerminalLine) => void,
  duration: number = 1500,
): Promise<void> {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  const spinnerLine: TerminalLine = {
    id: nextLineId(),
    text: `${frames[0]} ${text}`,
    color: "text-violet-400",
  };
  addLine(spinnerLine);

  const start = Date.now();
  let i = 0;
  while (Date.now() - start < duration) {
    await sleep(80);
    i = (i + 1) % frames.length;
    spinnerLine.text = `${frames[i]} ${text}`;
  }
  spinnerLine.text = `✓ ${text}`;
  spinnerLine.color = "text-emerald-400";
}

export async function animateScore(
  label: string,
  score: number,
  maxScore: number,
  addLine: (l: TerminalLine) => void,
  color: string,
): Promise<void> {
  const barWidth = 10;
  for (let i = 0; i <= score; i++) {
    const filled = Math.round((i / maxScore) * barWidth);
    const empty = barWidth - filled;
    const bar = "█".repeat(filled) + "░".repeat(empty);
    const display = `${label.padEnd(10)} ${bar} ${i}/${maxScore}`;

    if (i === 0) {
      addLine({ id: nextLineId(), text: display, color: "text-zinc-500" });
    } else {
      const lastLine = { id: nextLineId(), text: display, color };
      addLine(lastLine);
    }
    await sleep(60);
  }
}
