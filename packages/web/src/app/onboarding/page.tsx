/**
 * /onboarding — 5-step interactive flow that primes the founder before
 * they run `loopkit init` in the CLI.
 *
 * Step 1: "What are you building?" (one input)
 * Step 2: "Why does it matter?" (textarea)
 * Step 3: "How will you know in 4 weeks?" (3 radio options)
 * Step 4: "Install the CLI" (copy-paste + deep-link command)
 * Step 5: "Your first task" (auto-generated)
 *
 * State persists in sessionStorage so a refresh doesn't lose progress.
 * The generated command includes the answers as flags so the CLI's
 * `init --resume` can pre-fill.
 */

import type { Metadata } from "next";
import { OnboardingFlow } from "./OnboardingFlow";

export const metadata: Metadata = {
  title: "Get started with LoopKit — 4 minutes",
  description:
    "The fastest way to start shipping weekly. 5 short questions, then the CLI takes over.",
};

const SESSION_KEY = "loopkit:onboarding:v1";

export default function OnboardingPage() {
  return <OnboardingFlow sessionKey={SESSION_KEY} />;
}
