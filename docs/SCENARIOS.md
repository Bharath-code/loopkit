# LoopKit Interaction Scenarios

> _"The difference between good products and great products is how they behave in the edge cases."_

This document catalogs every possible way a user can interact with LoopKit — happy paths, edge cases, error states, and recovery flows. Use this for QA, support, and onboarding design.

---

## Scenario Format

```
**Scenario ID:** SC-[COMMAND]-[NUMBER]
**Title:** [Short description]
**Persona:** [Who experiences this]
**Trigger:** [What the user does]
**Pre-conditions:** [What must be true]
**Flow:** Step-by-step
**Expected Outcome:** [What should happen]
**Edge Cases:** [What could go wrong]
```

---

## `loopkit init` Scenarios

### SC-INIT-01: First-Time Happy Path

**Persona:** Alex (First-Time Founder)
**Trigger:** Runs `loopkit init` for the very first time
**Pre-conditions:** No `.loopkit/` directory exists

**Flow:**

1. User runs `loopkit init`
2. System detects no existing projects, creates `.loopkit/` directory
3. Clack prompts appear one by one:
   - "What are you building?" → "An AI tool for dentists"
   - "What problem does it solve?" → "Dentists spend 2 hours/day on insurance claims"
   - "Who is your ideal customer?" → "Solo dental practices with 1-3 staff"
   - "Why hasn't this been solved?" → "Existing solutions are enterprise-only and expensive"
   - "What's your MVP?" → "A web app that reads insurance forms and fills them automatically"
4. AI analyzes answers (2-3 seconds, streaming progress shown)
5. Scores displayed: ICP 9/10, Problem 8/10, MVP 7/10, Overall 8/10
6. Brief rendered in terminal with bet, riskiest assumption, validation plan
7. Files saved: `.loopkit/projects/ai-dentist/brief.md` and `.loopkit/projects/ai-dentist/brief.json`
8. `config.json` updated with `activeProject: "ai-dentist"`
9. `tasks.md` scaffold created with AI-personalized tasks

**Expected Outcome:** User has a validated brief and a clear plan for Week 1

**Edge Cases:**

- **SC-INIT-01a:** User presses Ctrl+C at question 3 → draft.json saved, resume offered on next run
- **SC-INIT-01b:** AI service unavailable → answers saved without scores, `--analyze` suggested
- **SC-INIT-01c:** User answers with < 5 words → soft warning shown, user can proceed anyway
- **SC-INIT-01d:** User's answer to Q2 contains "app that" or "platform that" → solution-in-disguise flag shown

---

### SC-INIT-02: Project Name Collision

**Persona:** Marcus (Indie Hacker)
**Trigger:** Runs `loopkit init saas` but project "saas" already exists
**Pre-conditions:** `.loopkit/projects/saas/` exists

**Flow:**

1. User runs `loopkit init saas`
2. System detects existing project
3. Prompt: "Project 'saas' already exists. What would you like to do?"
   - Overwrite existing
   - Create new version (saas-v2)
   - Resume from draft
4. User selects "Create new version"
5. Project saved as "saas-v2"

**Expected Outcome:** No data loss, user has clear options

**Edge Cases:**

- **SC-INIT-02a:** User chooses "Overwrite" → old brief.md backed up with timestamp? (No — we warn but respect choice)
- **SC-INIT-02b:** 10 versions exist (saas-v1 through saas-v10) → suggest "saas-v11" automatically

---

### SC-INIT-03: No API Key, Free Tier

**Persona:** Jordan (Side Project Shipper)
**Trigger:** Runs `loopkit init` without ANTHROPIC_API_KEY and without `loopkit auth`
**Pre-conditions:** No auth configured

**Flow:**

1. User runs `loopkit init`
2. System detects no API key and no auth token
3. Prompts continue normally (all 5 questions)
4. After last question: "AI analysis requires authentication. Run `loopkit auth` or set ANTHROPIC_API_KEY. Your answers have been saved."
5. Brief saved without scores: "_AI analysis unavailable. Scores pending._"

**Expected Outcome:** User doesn't lose work, clear next step provided

---

## `loopkit track` Scenarios

### SC-TRACK-01: Daily Check-In

**Persona:** Sarah (Solo Founder)
**Trigger:** Runs `loopkit track` on Wednesday afternoon
**Pre-conditions:** `tasks.md` exists with 5 tasks (2 done, 3 open)

**Flow:**

1. User runs `loopkit track`
2. System reads `tasks.md`
3. Board displayed:
   ```
   ✓ #1 Set up landing page (2 days ago)
   ✓ #2 Configure Stripe (1 day ago)
   ○ #3 Implement auth flow
   ○ #4 Write privacy policy
   ○ #5 Set up analytics
   ```
4. Shipping score: 40% (2/5)
5. One stale task detected (#3, open for 4 days)
6. Prompt: "Task #3 'Implement auth flow' has been open for 4 days. Keep / Snooze / Cut?"
7. User selects "Keep"
8. Board re-renders

**Expected Outcome:** Clear visibility into progress, stale items surfaced

**Edge Cases:**

- **SC-TRACK-01a:** No tasks.md exists → "No tasks found. Run `loopkit track --add` to create your first task."
- **SC-TRACK-01b:** All tasks done → "All tasks complete! Shipping score: 100%. Time to ship?"
- **SC-TRACK-01c:** 0 tasks done, 5 open → "Shipping score: 0%. Tip: Start with the smallest task to build momentum."
- **SC-TRACK-01d:** User is not in a git repo → "Warning: Not a git repository. Git hook features disabled. Run `git init` to enable auto-close."

---

### SC-TRACK-02: Commit Auto-Close

**Persona:** Marcus (Indie Hacker)
**Trigger:** Commits with `git commit -m "[#2] Fix OAuth redirect"`
**Pre-conditions:** Git hook installed, task #2 exists and is open

**Flow:**

1. User writes commit message with `[#2]`
2. Git hook fires (commit-msg)
3. Hook reads tasks.md, finds task #2
4. Task #2 marked as done, closedVia set to commit SHA
5. Commit proceeds normally
6. User runs `loopkit track` → sees task #2 as done

**Expected Outcome:** Zero-friction task management

**Edge Cases:**

- **SC-TRACK-02a:** Task #2 already done → hook appends to closedVia (comma-separated SHAs), no error
- **SC-TRACK-02b:** Task #999 doesn't exist → hook warns but doesn't block commit: "Warning: Task #999 not found in tasks.md"
- **SC-TRACK-03c:** Multiple tasks: `[#2] [#4] Update both flows` → both tasks closed
- **SC-TRACK-02d:** Hook takes > 50ms → optimize by reading COMMIT_EDITMSG directly instead of execSync

---

### SC-TRACK-03: Adding Tasks

**Persona:** Marcus (Indie Hacker)
**Trigger:** Has an idea while coding, wants to capture it

**Flow (inline):**

1. User runs `loopkit track --add "Add dark mode toggle"`
2. Task appended to tasks.md with next sequential ID and today's date
3. Output: "✓ Task #6 added"

**Flow (editor):**

1. User runs `loopkit track --add` (no argument)
2. $EDITOR opens with a blank file
3. User types multi-line task description
4. Saves and exits
5. Task added with next sequential ID

**Expected Outcome:** Ideas captured instantly without breaking flow

**Edge Cases:**

- **SC-TRACK-03a:** $EDITOR not set, nano not available → fallback to `vi`, then prompt for text
- **SC-TRACK-03b:** User saves empty file → "No task text provided. Task not added."
- **SC-TRACK-03c:** tasks.md has IDs [1,2,3,5] (missing #4) → next ID is 6 (doesn't reuse 4)

---

### SC-TRACK-04: Switching Projects

**Persona:** Marcus (Indie Hacker)
**Trigger:** Wants to check status of a different project

**Flow:**

1. User runs `loopkit track --project old-saas`
2. System checks if project exists
3. If yes: updates `config.activeProject` to "old-saas", shows that project's board
4. If no: "Project 'old-saas' not found. Run `loopkit init old-saas` to create it."

**Expected Outcome:** Seamless context switching

---

## `loopkit ship` Scenarios

### SC-SHIP-01: First Launch

**Persona:** Sarah (Solo Founder)
**Trigger:** Just deployed v1.0, ready to announce
**Pre-conditions:** brief.json exists, tasks.md has completed tasks

**Flow:**

1. User runs `loopkit ship`
2. System reads brief.json for context
3. System reads tasks.md for completed tasks
4. Prompt: "What's the main thing you shipped?" → "Launched the MVP with auth and core feature"
5. Pre-launch checklist:
   - README updated? [y/n] → y
   - Landing page live? [y/n] → y
   - Analytics set up? [y/n] → y
   - Feedback channel ready? [y/n] → y
6. AI generates drafts (streaming progress)
7. Three drafts shown:
   - HN: title + body
   - Twitter: 3 tweets
   - IH: narrative post
8. Per-draft actions: [u]se / [e]dit / [r]egenerate / [s]kip
9. User presses [u] for Twitter, [e] for HN (edits in $EDITOR), [s] for IH
10. Ship log saved to `.loopkit/ships/2026-04-26.md`

**Expected Outcome:** User launches on multiple platforms in < 15 minutes

**Edge Cases:**

- **SC-SHIP-01a:** No brief.json → fallback to 2 inline questions for context
- **SC-SHIP-01b:** AI fails mid-generation → saves log with what user manually entered, shows error message
- **SC-SHIP-01c:** Ship log already exists for today → prompt: "Ship log for today exists. Overwrite / Append / Skip?"
- **SC-SHIP-01d:** $EDITOR not set → falls back to nano, then vi, then inline prompt

---

### SC-SHIP-02: Regenerate Draft

**Persona:** Marcus (Indie Hacker)
**Trigger:** Doesn't like the Twitter thread AI generated

**Flow:**

1. User sees Twitter draft, presses `[r]egenerate`
2. System re-calls AI with same context but slightly varied prompt
3. New Twitter thread generated
4. User sees new draft, chooses `[u]se`

**Expected Outcome:** User gets alternatives without starting over

---

## `loopkit pulse` Scenarios

### SC-PULSE-01: First Feedback Collection

**Persona:** Alex (First-Time Founder)
**Trigger:** Wants to start collecting feedback after landing page launch

**Flow:**

1. User runs `loopkit pulse --share`
2. System checks auth → verifies token
3. Reads active project name and slug from config
4. Calls `/api/pulse/share` → creates/gets project in Convex
5. Returns URL + QR code in terminal
6. User shares URL in 3 relevant communities
7. Responses start coming in
8. User runs `loopkit pulse` → sees count, still < 5, shows raw

**Expected Outcome:** Feedback collection starts in < 2 minutes

**Edge Cases:**

- **SC-PULSE-01a:** Not authenticated → "Authentication required. Run `loopkit auth` first."
- **SC-PULSE-01b:** No active project → "No active project. Run `loopkit init` first."
- **SC-PULSE-01c:** API call fails → shows error with URL to check status manually

---

### SC-PULSE-02: AI Clustering

**Persona:** Sarah (Solo Founder)
**Trigger:** Has collected 12 responses, wants insights

**Flow:**

1. User runs `loopkit pulse`
2. System reads 12 responses from `.loopkit/pulse/responses.json`
3. Spinner: "Clustering feedback..."
4. AI generates clusters (streaming: "3 fields parsed")
5. Output:

   ```
   ● Fix now (3)
     Users confused by onboarding
     → "I couldn't figure out how to create my first project"
     → "The welcome screen is overwhelming"
     → "I clicked around for 5 minutes and gave up"

   ● Validate later (5)
     Requests for team features
     → "Can my co-founder see the dashboard too?"
     → "I need to share this with my team"

   ● Noise (4)
     Unrelated praise and complaints

   Confidence: 85% clearly clustered
   ```

6. Prompt: "Tag 'Users confused by onboarding' to this week's sprint?"
7. User confirms → task added to tasks.md

**Expected Outcome:** 12 raw responses → 3 actionable insights in 10 seconds

**Edge Cases:**

- **SC-PULSE-02a:** AI clustering fails → shows raw responses with apology message
- **SC-PULSE-02b:** All responses are outliers → "Low confidence (30%). Consider collecting more targeted feedback."
- **SC-PULSE-02c:** User runs with `--raw` flag → skips AI, shows numbered list

---

### SC-PULSE-03: Adding Response Inline

**Persona:** Marcus (Indie Hacker)
**Trigger:** Gets a DM from a user with feedback

**Flow:**

1. User runs `loopkit pulse --add "User said the pricing page is confusing"`
2. Response appended to `.loopkit/pulse/responses.json`
3. Output: "Response added (6 total). Need 4 more for AI clustering."

**Expected Outcome:** Feedback captured in 3 seconds

---

## `loopkit loop` Scenarios

### SC-LOOP-01: Sunday Ritual (Normal Week)

**Persona:** Jordan (Side Project Shipper)
**Trigger:** Sunday 9 AM, weekly synthesis time
**Pre-conditions:** 3 weeks of loop logs exist, tasks done this week

**Flow:**

1. User runs `loopkit loop`
2. System aggregates data locally (< 1 second):
   - Tasks done: 4, Tasks total: 5, Shipping score: 80%
   - Last ship: 3 days ago
   - Pulse responses: 8
   - 3-week streak active
3. AI synthesis (2-3 seconds):
   ```
   The One Thing: Fix the onboarding drop-off
   Rationale: 3/8 pulse responses mention onboarding confusion.
             Your shipping score is strong (80%).
             This is the highest-leverage fix before next ship.
   Tension: Your track plan focuses on "API docs" but pulse says
            "onboarding" is the blocker. Consider reprioritizing.
   ```
4. Prompt: "Accept / Change / Skip"
5. User presses "Accept"
6. BIP post generated (280-char check passes)
7. Loop log saved to `.loopkit/logs/week-16.md`
8. Output: "Next: loopkit init" (if no active project) or "Next: loopkit track"

**Expected Outcome:** Clear priority for next week, public accountability post ready

**Edge Cases:**

- **SC-LOOP-01a:** No tasks done this week → "Unstuck mode": AI offers 3 micro-tasks based on brief context
- **SC-LOOP-01b:** Override rate > 50% for 4 weeks → "You've overridden the AI recommendation 6 of the last 8 weeks. The system works best when you trust it. Consider why you disagree so often."
- **SC-LOOP-01c:** First week ever → asks 2 inline questions, no AI needed
- **SC-LOOP-01d:** Mid-week (Wednesday) → "Mid-week check-in. Full synthesis available on Sunday. Here's your progress so far..."

---

### SC-LOOP-02: Override Decision

**Persona:** Marcus (Indie Hacker)
**Trigger:** Disagrees with AI recommendation

**Flow:**

1. AI recommends: "The One Thing: Fix onboarding"
2. Marcus wants to work on API docs instead
3. User selects "Change"
4. Prompt: "What's your priority instead?"
5. User enters: "Write API documentation"
6. Prompt: "Why? (helps us improve recommendations)"
7. User enters: "A potential enterprise customer is waiting for API docs"
8. Override recorded with reason
9. BIP post still generated based on actual week data

**Expected Outcome:** User maintains agency, system learns from overrides

---

## `loopkit auth` Scenarios

### SC-AUTH-01: First Login

**Persona:** Sarah (Solo Founder)
**Trigger:** Wants to use AI features without managing an API key

**Flow:**

1. User runs `loopkit auth`
2. Spinner: "Generating authentication session"
3. Code generated (e.g., "A7B9C2")
4. User shown URL: `http://localhost:3000/cli-auth?code=A7B9C2`
5. User opens URL in browser, logs in with GitHub
6. Web app completes flow, token sent to CLI session
7. CLI receives token, saves encrypted to config.json
8. Output: "✓ You are now logged in and ready to ship."

**Expected Outcome:** Seamless browser-to-CLI auth

**Edge Cases:**

- **SC-AUTH-01a:** User doesn't complete browser flow within 2 minutes → "Authentication timed out. Please try running loopkit auth again."
- **SC-AUTH-01b:** Browser auth fails → error propagated to CLI
- **SC-AUTH-01c:** Token expires (401 on next API call) → "Your session has expired. Please run `loopkit auth` to log in again."

---

## Cross-Command Scenarios

### SC-CROSS-01: Full Week Cycle

**Persona:** Sarah (Solo Founder)
**Trigger:** First week using LoopKit

**Monday:**

- `loopkit init my-saas` → brief created, tasks.md scaffolded with AI-personalized tasks
- Adds 5 tasks to "This Week"

**Tuesday-Thursday:**

- Codes, commits with `[#1]`, `[#2]` → tasks auto-close
- `loopkit track` daily to check progress

**Friday:**

- Ships feature
- `loopkit ship` → generates launch copy, posts to Twitter
- Ship log saved

**Saturday:**

- Shares feedback form from `loopkit pulse --share`
- Gets 5 responses in Discord

**Sunday:**

- `loopkit loop` → synthesis recommends next week's focus
- Accepts recommendation
- BIP post shared on Twitter
- 1-week streak started

**Expected Outcome:** Complete shipping loop closed in 7 days

---

### SC-CROSS-02: Context Switching Between Projects

**Persona:** Marcus (Indie Hacker)
**Trigger:** Managing 2 active projects

**Flow:**

1. Monday: `loopkit track --project ai-image-gen` → works on Project A
2. Wednesday: `loopkit ship` → ships Project A feature
3. Thursday: `loopkit track --project chrome-extension` → switches to Project B
4. Friday: `loopkit pulse --share` → creates feedback form for Project B
5. Sunday: `loopkit loop` → synthesis for Project B (the active project)

**Expected Outcome:** Clear separation of project contexts

**Edge Cases:**

- **SC-CROSS-02a:** Forgets which project is active → `loopkit track` shows project name in header
- **SC-CROSS-02b:** Tries to pulse share for wrong project → always uses active project, user must switch first

---

### SC-CROSS-03: Free Tier Journey

**Persona:** Jordan (Side Project Shipper)
**Trigger:** Using LoopKit on free tier

**Flow:**

1. `loopkit init` → works fine (no AI needed, or brief saved without scores)
2. `loopkit track` → works fully (local only)
3. `loopkit ship` → AI generates drafts, uses 1 of 10 daily AI calls
4. `loopkit pulse` → 5 responses, AI clusters, uses 1 AI call
5. `loopkit loop` → AI synthesis, uses 1 AI call
6. Day 1 total: 3 AI calls used
7. Day 2: Tries `loopkit init --analyze` → uses 1 call
8. Day 5: Has used 9 calls → next call shows warning: "1 AI call remaining today"
9. Day 5 (later): Tries another call → "Rate limit exceeded: 10/10 AI calls today. Upgrade for unlimited."

**Expected Outcome:** Clear usage tracking, gentle upgrade prompts, no hard lockouts

---

## Error Recovery Scenarios

### SC-ERROR-01: No Internet Connection

**Trigger:** User runs `loopkit init` while offline

**Flow:**

1. User answers all 5 questions (local, works offline)
2. AI analysis attempted → network error
3. System: "AI analysis unavailable while offline. Your answers have been saved. Run `loopkit init --analyze my-project` when you're back online."
4. Brief saved without scores

**Recovery:** User connects to internet, runs `--analyze`, gets full brief

---

### SC-ERROR-02: Corrupted Config

**Trigger:** `config.json` is manually edited and malformed

**Flow:**

1. Any command reads config
2. JSON parse fails
3. System: "Warning: Config file corrupted. Resetting to defaults. Your project data is safe."
4. Config reset to `{version: 1}`
5. Command continues with defaults

**Recovery:** User re-runs `loopkit auth` if needed, re-sets active project

---

### SC-ERROR-03: Deleted tasks.md

**Trigger:** User accidentally deletes tasks.md

**Flow:**

1. User runs `loopkit track`
2. System: "No tasks found. Run `loopkit track --add` to create your first task."
3. User can recreate tasks, but historical data is lost

**Prevention:** Git commits should include tasks.md

---

### SC-ERROR-04: Git Hook Corruption

**Trigger:** User's commit-msg hook is corrupted by another tool

**Flow:**

1. LoopKit's hook is append-only (never overwrites)
2. If another tool overwrites the hook, LoopKit's pattern detection won't work
3. User runs `loopkit track` → detects hook missing, offers to reinstall
4. User confirms → hook reinstalled (append-only, preserving other tool's logic)

**Prevention:** Append-only hook design respects existing hooks

---

## Onboarding Scenarios

### SC-ONBOARD-01: Complete Newbie

**Persona:** Alex (First-Time Founder)
**Trigger:** Just installed LoopKit, never used it

**Flow:**

1. `npm install -g loopkit`
2. `loopkit --help` → sees 5 commands, intrigued
3. `loopkit init` → guided through first brief
4. Sees score bar, feels relief (or motivation to improve)
5. Reads brief.md → "I finally have a plan!"
6. `loopkit track --add "Interview 5 potential users"`
7. Week 1: tracks progress, feels accountability
8. Sunday: `loopkit loop` → first synthesis, feels direction

**Expected Outcome:** From install to first loop closed in 7 days

---

### SC-ONBOARD-02: Skeptical Power User

**Persona:** Marcus (Indie Hacker)
**Trigger:** Heard about LoopKit, thinks it's "just another tool"

**Flow:**

1. Sees tweet about LoopKit
2. Installs skeptically
3. `loopkit init` → answers questions quickly, expects generic advice
4. Sees AI flag his solution-in-disguise answer → "Wait, that's actually helpful"
5. Gets specific validation plan → "This is better than my Notion template"
6. `loopkit ship` → AI generates Twitter thread → "This would have taken me 30 minutes"
7. Converts to daily user

**Expected Outcome:** Skeptic becomes advocate in 1 week

---

## Growth Loop Scenarios

### SC-GROWTH-01: First Milestone Triggered (Week 1)

**Persona:** Alex (First-Time Founder)
**Trigger:** Completes first loop (week 1)
**Pre-conditions:** First loop log saved

**Flow:**

1. User runs `loopkit loop` on Sunday
2. Week number detected: 1
3. Milestone detection logic identifies "first week completed"
4. Encouraging message displayed: "🎉 First week complete! The hardest week is behind you."
5. Milestone trigger synced to Convex (if authenticated)
6. Email notification sent (if opted in)

**Expected Outcome:** User feels celebrated and motivated to continue

**Edge Cases:**

- **SC-GROWTH-01a:** Not authenticated → milestone still detected, no Convex sync, no email
- **SC-GROWTH-01b:** Week 1 but no loop log → milestone not triggered (requires actual loop completion)

---

### SC-GROWTH-02: Friday Reminder Triggered

**Persona:** Sarah (Solo Founder)
**Trigger:** Cron job runs `loopkit remind:friday` at 4 PM on Friday
**Pre-conditions:** Cron job installed via `loopkit init --cron`

**Flow:**

1. Cron job executes at 4 PM Friday
2. Command runs `loopkit remind:friday`
3. System checks if user shipped this week (has ship log)
4. If shipped: Terminal notification "🚀 You shipped this week! Great job!"
5. If not shipped: Terminal notification "⚠️ Haven't shipped yet this week. Time to ship?" with option to run `loopkit ship`
6. User can respond with [s] to run ship immediately or dismiss

**Expected Outcome:** Gentle nudge helps user remember to ship before weekend

**Edge Cases:**

- **SC-GROWTH-02a:** Terminal notifications not supported on platform → falls back to console output
- **SC-GROWTH-02b:** Cron job not installed → reminder never runs (user must install manually)

---

### SC-GROWTH-03: Validation Mode

**Persona:** Marcus (Indie Hacker)
**Trigger:** Runs `loopkit init --validate` to stress-test brief
**Pre-conditions:** Brief exists (new or existing)

**Flow:**

1. User runs `loopkit init my-saas --validate`
2. Normal init flow completes (questions answered, brief generated)
3. After brief saved, validation prompt appears: "Running devil's advocate validation..."
4. AI generates 3 challenging questions based on brief
5. Questions displayed in terminal box
6. Encouragement message: "These questions are designed to strengthen your thinking, not discourage you."
7. Prompt: "Want to iterate on your brief based on these questions?" [y/n]
8. If yes: Suggestion to run `loopkit init --analyze my-saas` to update

**Expected Outcome:** User catches potential weaknesses before building

**Edge Cases:**

- **SC-GROWTH-03a:** AI unavailable → validation skipped, warning shown
- **SC-GROWTH-03b:** User says no → validation complete, brief remains as-is

---

### SC-GROWTH-04: Shell Aliases Installation

**Persona:** Jordan (Side Project Shipper)
**Trigger:** First-time user runs `loopkit init`
**Pre-conditions:** No aliases installed yet

**Flow:**

1. User completes `loopkit init`
2. After brief saved, prompt appears: "Install shell aliases for faster commands? (Recommended)"
3. User selects yes
4. System detects shell (zsh/bash/fish)
5. Aliases appended to shell config file:
   - `lk` → `loopkit`
   - `lks` → `loopkit ship`
   - `lkl` → `loopkit loop`
   - `lkt` → `loopkit track`
6. config.json updated with `aliasesInstalled: true`
7. Output: "Shell aliases installed: lk, lks, lkl, lkt. Restart your shell to apply changes."

**Expected Outcome:** User can use shorter commands after shell restart

**Edge Cases:**

- **SC-GROWTH-04a:** User declines → aliases not installed, can run `loopkit aliases` later
- **SC-GROWTH-04b:** Shell not detected → message shown with manual instructions
- **SC-GROWTH-04c:** Config file not found → falls back to default locations

---

### SC-GROWTH-05: Async Loop Mode

**Persona:** Sarah (Solo Founder)
**Trigger:** Traveling on Wednesday, wants to run loop early
**Pre-conditions:** Previous loop was 5 days ago

**Flow:**

1. User runs `loopkit loop --async`
2. System detects it's not Sunday
3. Async mode enabled: skips mid-week check-in prompt
4. Checks days since last loop: 5 days (within 7-day window)
5. Proceeds with full AI synthesis
6. Output shows "Week 7 Review (Async Mode)"
7. Loop log saved normally
8. Streak preserved (not broken by running early)

**Expected Outcome:** User can maintain streak despite scheduling constraints

**Edge Cases:**

- **SC-GROWTH-05a:** More than 7 days since last loop → warning: "It's been 8 days since your last loop. Your streak may be affected."
- **SC-GROWTH-05b:** No previous loop → proceeds normally (first loop)

---

### SC-GROWTH-06: Almost There Nudge

**Persona:** Marcus (Indie Hacker)
**Trigger:** Running `loopkit track` on Thursday afternoon
**Pre-conditions:** Shipping score is 60%, 2 tasks remaining

**Flow:**

1. User runs `loopkit track`
2. System calculates shipping score: 60% (3/5 tasks done)
3. Detects conditions: score 50-70% range, exactly 2 tasks open
4. Nudge displayed: "Almost there — 2 tasks left to hit 80%."
5. Suggested actions shown:
   - "→ loopkit track #4 --done (if you finished it)"
   - "→ loopkit track #4 --snooze tomorrow"
6. User motivated to complete tasks before end of week

**Expected Outcome:** Small nudge helps user reach higher completion rate

**Edge Cases:**

- **SC-GROWTH-06a:** Score outside 50-70% range → no nudge shown
- **SC-GROWTH-06b:** Not exactly 2 tasks remaining → no nudge shown

---

### SC-GROWTH-07: Referral Prompt

**Persona:** Jordan (Side Project Shipper)
**Trigger:** Completes 4-week streak
**Pre-conditions:** User has streak ≥4, referral not yet shown

**Flow:**

1. User runs `loopkit loop`
2. Current streak calculated: 4 weeks
3. System checks config: `referralShown` is false
4. Prompt appears: "Share LoopKit with a founder friend and get 1 month of Solo free?"
5. User selects yes
6. System generates 8-character referral code (e.g., "a3b7c9d2")
7. Referral link displayed: "loopkit.dev/r/a3b7c9d2"
8. Encouragement: "Share this link — when a friend signs up, you both get 1 month free."
9. config.json updated with `referralShown: true` and `referralCode: "a3b7c9d2"`

**Expected Outcome:** User motivated to share, referral system activated

**Edge Cases:**

- **SC-GROWTH-07a:** User declines → referral not shown again (flag prevents repeat prompts)
- **SC-GROWTH-07b:** Streak < 4 → referral prompt not shown yet

---

### SC-GROWTH-08: Public Wins Sharing

**Persona:** Sarah (Solo Founder)
**Trigger:** Runs `loopkit celebrate --share` after shipping
**Pre-conditions:** User is authenticated, has shipping score

**Flow:**

1. User runs `loopkit celebrate --share`
2. Celebration card displayed with score, streak, rank
3. System checks authentication status
4. If authenticated:
   - Reads pulse responses count
   - Builds public win payload (product name, week, score, streak, tasks, feedback)
   - Syncs to Convex via `/api/sync/win`
   - Output: "Win posted to public feed at loopkit.dev/wins"
5. If not authenticated:
   - Warning: "Not authenticated — win not posted to public feed. Run `loopkit auth` to enable sharing."
   - Celebration still displays locally

**Expected Outcome:** User's win shared to community for accountability and discovery

**Edge Cases:**

- **SC-GROWTH-08a:** API call fails → warning shown, celebration still completes
- **SC-GROWTH-08b:** Not authenticated → clear next step provided

---

### SC-GROWTH-09: Streak Break Milestone

**Persona:** Marcus (Indie Hacker)
**Trigger:** Missed a week, streak broken after 8-week run
**Pre-conditions:** Previous streak was 8 weeks

**Flow:**

1. User runs `loopkit loop` after 2-week gap
2. System detects streak break (gap > 7 days)
3. Milestone detection identifies "streak break after 8 weeks"
4. Encouraging message: "You had an 8-week streak before! Life happens — what matters is you're back."
5. Encouragement to restart: "Let's build a new streak together."
6. Streak counter resets to 0, starts counting from this week

**Expected Outcome:** User feels supported rather than guilty about breaking streak

**Edge Cases:**

- **SC-GROWTH-09a:** First streak break after 4+ weeks → milestone triggered
- **SC-GROWTH-09b:** First week ever → no streak break milestone (no previous streak)

---

### SC-GROWTH-10: First Revenue Milestone

**Persona:** Alex (First-Time Founder)
**Trigger:** Logs first revenue via `loopkit revenue` or `loopkit loop --revenue`
**Pre-conditions:** Previous revenue was null or 0

**Flow:**

1. User runs `loopkit revenue 100` (or `loopkit loop --revenue 100`)
2. System detects first revenue (previous was 0)
3. Milestone detection identifies "first revenue"
4. Celebration message: "🎉 First dollar! This is a huge milestone. Many founders never make it here."
5. Milestone synced to Convex
6. Email notification sent (if opted in)

**Expected Outcome:** User feels celebrated for reaching first revenue milestone

**Edge Cases:**

- **SC-GROWTH-10a:** Revenue logged is $0 → not considered first revenue milestone
- **SC-GROWTH-10b:** Revenue already > 0 → milestone not triggered

---

_Last updated: April 2026 · Phase 13 growth loops added_
