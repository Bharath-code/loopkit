import { describe, it, expect } from "vitest";
import { buildInitPrompt, INIT_SYSTEM_PROMPT } from "../prompts/init";
import { buildLoopPrompt, LOOP_SYSTEM_PROMPT } from "../prompts/loop";
import { buildPulsePrompt, PULSE_SYSTEM_PROMPT } from "../prompts/pulse";
import { buildShipPrompt, SHIP_SYSTEM_PROMPT } from "../prompts/ship";
import { buildUnstuckPrompt, UNSTUCK_SYSTEM_PROMPT } from "../prompts/unstuck";

describe("INIT_SYSTEM_PROMPT", () => {
  it("contains scoring rules", () => {
    expect(INIT_SYSTEM_PROMPT).toContain("ICP:");
    expect(INIT_SYSTEM_PROMPT).toContain("PROBLEM:");
    expect(INIT_SYSTEM_PROMPT).toContain("MVP SCOPE:");
  });

  it("contains critical rules", () => {
    expect(INIT_SYSTEM_PROMPT).toContain("NEVER");
    expect(INIT_SYSTEM_PROMPT).toContain("validate action");
  });

  it("contains few-shot examples", () => {
    expect(INIT_SYSTEM_PROMPT).toContain("Example 1");
    expect(INIT_SYSTEM_PROMPT).toContain("Example 2");
    expect(INIT_SYSTEM_PROMPT).toContain("Example 3");
  });
});

describe("buildInitPrompt", () => {
  it("includes all founder answers", () => {
    const answers = {
      name: "TestApp",
      problem: "Devs waste time on config",
      icp: "Senior React devs",
      whyUnsolved: "Tools are too generic",
      mvp: "A CLI for project configs",
    };
    const prompt = buildInitPrompt(answers);
    expect(prompt).toContain("Name: TestApp");
    expect(prompt).toContain("Problem: Devs waste time on config");
    expect(prompt).toContain("ICP: Senior React devs");
    expect(prompt).toContain("Why unsolved: Tools are too generic");
    expect(prompt).toContain("MVP: A CLI for project configs");
  });

  it("includes instruction to produce brief", () => {
    const answers = {
      name: "X",
      problem: "Y",
      icp: "Z",
      whyUnsolved: "W",
      mvp: "V",
    };
    const prompt = buildInitPrompt(answers);
    expect(prompt).toContain("Analyze these founder answers");
    expect(prompt).toContain("produce the brief");
  });
});

describe("LOOP_SYSTEM_PROMPT", () => {
  it("contains ranking logic", () => {
    expect(LOOP_SYSTEM_PROMPT).toContain("Fix now");
    expect(LOOP_SYSTEM_PROMPT).toContain("riskiest assumption");
  });

  it("contains BIP post rules", () => {
    expect(LOOP_SYSTEM_PROMPT).toContain("280 characters");
    expect(LOOP_SYSTEM_PROMPT).toContain("build-in-public");
  });

  it("contains critical rules", () => {
    expect(LOOP_SYSTEM_PROMPT).toContain("ONE recommendation");
    expect(LOOP_SYSTEM_PROMPT).toContain("tension");
  });
});

describe("buildLoopPrompt", () => {
  it("includes product name and week", () => {
    const prompt = buildLoopPrompt({
      productName: "TestApp",
      weekNumber: 3,
      tasksCompleted: [],
      tasksOpen: [],
    });
    expect(prompt).toContain("Product: TestApp");
    expect(prompt).toContain("Week: 3");
  });

  it("includes bet when provided", () => {
    const prompt = buildLoopPrompt({
      productName: "X",
      weekNumber: 1,
      bet: "Freelancers need better proposals",
      riskiestAssumption: "Clients care about format",
      tasksCompleted: [],
      tasksOpen: [],
    });
    expect(prompt).toContain("Bet: Freelancers need better proposals");
    expect(prompt).toContain("Riskiest assumption: Clients care about format");
  });

  it("formats completed tasks as list", () => {
    const prompt = buildLoopPrompt({
      productName: "X",
      weekNumber: 1,
      tasksCompleted: ["Build landing page", "Setup auth"],
      tasksOpen: [],
    });
    expect(prompt).toContain("- Build landing page");
    expect(prompt).toContain("- Setup auth");
  });

  it("shows 'None this week' when no tasks completed", () => {
    const prompt = buildLoopPrompt({
      productName: "X",
      weekNumber: 1,
      tasksCompleted: [],
      tasksOpen: ["Task A"],
    });
    expect(prompt).toContain("None this week");
  });

  it("includes open tasks", () => {
    const prompt = buildLoopPrompt({
      productName: "X",
      weekNumber: 1,
      tasksCompleted: [],
      tasksOpen: ["Task A", "Task B"],
    });
    expect(prompt).toContain("Task A");
    expect(prompt).toContain("Task B");
  });

  it("includes ship log when provided", () => {
    const prompt = buildLoopPrompt({
      productName: "X",
      weekNumber: 1,
      tasksCompleted: [],
      tasksOpen: [],
      shipLog: "Shipped landing page",
    });
    expect(prompt).toContain("Ship log:");
    expect(prompt).toContain("Shipped landing page");
  });

  it("includes pulse data when provided", () => {
    const prompt = buildLoopPrompt({
      productName: "X",
      weekNumber: 1,
      tasksCompleted: [],
      tasksOpen: [],
      pulseData: "Users confused by onboarding",
    });
    expect(prompt).toContain("Pulse feedback:");
    expect(prompt).toContain("Users confused by onboarding");
  });

  it("ends with synthesis instruction", () => {
    const prompt = buildLoopPrompt({
      productName: "X",
      weekNumber: 1,
      tasksCompleted: [],
      tasksOpen: [],
    });
    expect(prompt).toContain("Synthesize this week");
  });
});

describe("PULSE_SYSTEM_PROMPT", () => {
  it("defines three cluster labels", () => {
    expect(PULSE_SYSTEM_PROMPT).toContain("Fix now");
    expect(PULSE_SYSTEM_PROMPT).toContain("Validate later");
    expect(PULSE_SYSTEM_PROMPT).toContain("Noise");
  });

  it("contains clustering rules", () => {
    expect(PULSE_SYSTEM_PROMPT).toContain("at least 2 responses");
    expect(PULSE_SYSTEM_PROMPT).toContain("fewer than 5");
  });

  it("contains critical rules", () => {
    expect(PULSE_SYSTEM_PROMPT).toContain("NEVER invent quotes");
    expect(PULSE_SYSTEM_PROMPT).toContain("Max 200 words");
  });
});

describe("buildPulsePrompt", () => {
  it("includes response count", () => {
    const prompt = buildPulsePrompt(["feedback 1", "feedback 2", "feedback 3"]);
    expect(prompt).toContain("3 feedback responses");
  });

  it("numbers each response", () => {
    const prompt = buildPulsePrompt(["first", "second", "third"]);
    expect(prompt).toContain('1. "first"');
    expect(prompt).toContain('2. "second"');
    expect(prompt).toContain('3. "third"');
  });

  it("handles empty array", () => {
    const prompt = buildPulsePrompt([]);
    expect(prompt).toContain("0 feedback responses");
  });

  it("handles single response", () => {
    const prompt = buildPulsePrompt(["Only feedback"]);
    expect(prompt).toContain("1 feedback response");
    expect(prompt).toContain('"Only feedback"');
  });
});

describe("SHIP_SYSTEM_PROMPT", () => {
  it("defines all three platform formats", () => {
    expect(SHIP_SYSTEM_PROMPT).toContain("show HN");
    expect(SHIP_SYSTEM_PROMPT).toContain("twitter thread");
    expect(SHIP_SYSTEM_PROMPT).toContain("indie hackers update");
  });

  it("contains word limits", () => {
    expect(SHIP_SYSTEM_PROMPT).toContain("500 words");
    expect(SHIP_SYSTEM_PROMPT).toContain("280 characters");
    expect(SHIP_SYSTEM_PROMPT).toContain("300 words");
  });

  it("contains banned words list", () => {
    expect(SHIP_SYSTEM_PROMPT).toContain("game-changer");
    expect(SHIP_SYSTEM_PROMPT).toContain("revolutionary");
    expect(SHIP_SYSTEM_PROMPT).toContain("excited to announce");
  });
});

describe("buildShipPrompt", () => {
  it("includes all context fields", () => {
    const prompt = buildShipPrompt({
      productName: "TestApp",
      bet: "Freelancers need proposals",
      icp: "Freelance developers",
      problem: "Proposals look amateur",
      tasksCompleted: ["Build PDF generator"],
      whatShipped: "PDF export feature",
    });
    expect(prompt).toContain("Product: TestApp");
    expect(prompt).toContain("Bet: Freelancers need proposals");
    expect(prompt).toContain("ICP: Freelance developers");
    expect(prompt).toContain("Problem: Proposals look amateur");
    expect(prompt).toContain("Build PDF generator");
    expect(prompt).toContain("PDF export feature");
  });

  it("omits optional fields when not provided", () => {
    const prompt = buildShipPrompt({
      productName: "TestApp",
      tasksCompleted: [],
      whatShipped: "Something",
    });
    expect(prompt).not.toContain("Bet:");
    expect(prompt).not.toContain("ICP:");
    expect(prompt).not.toContain("Problem:");
  });

  it("formats tasks as list", () => {
    const prompt = buildShipPrompt({
      productName: "X",
      tasksCompleted: ["Task A", "Task B"],
      whatShipped: "Feature",
    });
    expect(prompt).toContain("- Task A");
    expect(prompt).toContain("- Task B");
  });

  it("ends with generation instruction", () => {
    const prompt = buildShipPrompt({
      productName: "X",
      tasksCompleted: [],
      whatShipped: "Feature",
    });
    expect(prompt).toContain("Generate all three platform drafts");
  });
});

describe("UNSTUCK_SYSTEM_PROMPT", () => {
  it("mentions micro-task constraints", () => {
    expect(UNSTUCK_SYSTEM_PROMPT).toContain("30-90 minutes");
    expect(UNSTUCK_SYSTEM_PROMPT).toContain("exactly 3");
  });

  it("specifies JSON-only output", () => {
    expect(UNSTUCK_SYSTEM_PROMPT).toContain("ONLY a JSON object");
  });
});

describe("buildUnstuckPrompt", () => {
  it("includes product name", () => {
    const prompt = buildUnstuckPrompt({ productName: "MyApp" });
    expect(prompt).toContain("MyApp");
  });

  it("includes brief context when available", () => {
    const prompt = buildUnstuckPrompt({
      productName: "MyApp",
      problem: "Devs waste time",
      icp: "Solo founders",
      bet: "CLI tools are underserved",
      riskiestAssumption: "People will pay",
      mvpPlainEnglish: "A task tracker",
    });
    expect(prompt).toContain("Devs waste time");
    expect(prompt).toContain("Solo founders");
    expect(prompt).toContain("CLI tools are underserved");
    expect(prompt).toContain("People will pay");
    expect(prompt).toContain("A task tracker");
  });

  it("mentions 0 tasks context", () => {
    const prompt = buildUnstuckPrompt({ productName: "MyApp" });
    expect(prompt).toContain("0 tasks completed");
  });

  it("omits undefined fields", () => {
    const prompt = buildUnstuckPrompt({ productName: "MyApp" });
    expect(prompt).not.toContain("undefined");
    expect(prompt).not.toContain("Problem:");
    expect(prompt).not.toContain("ICP:");
  });
});
