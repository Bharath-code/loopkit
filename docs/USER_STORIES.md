# LoopKit User Stories

> _"A user story is a promise for a conversation."_ — Ron Jeffries

This document maps every LoopKit feature to real user stories with acceptance criteria. Use this for development prioritization, QA testing, and onboarding design.

---

## Story Format

```
As a [persona]
I want to [action]
So that [outcome/value]
```

**Acceptance Criteria:**

- Given [context], when [action], then [result]

**Priority:** 🔴 High / 🟡 Medium / 🟢 Low
**Effort:** S / M / L
**Persona:** Primary beneficiary

---

## Phase 1: Define (`loopkit init`)

### US-INIT-01: Score My Idea Before Building

```
As a first-time founder (Alex)
I want to answer 5 structured questions about my idea
So that I get an objective score before writing any code
```

**Acceptance Criteria:**

- Given I run `loopkit init`, when I answer all 5 questions, then I receive scores for ICP, Problem, and MVP (1-10)
- Given my answer is < 5 words, when I submit it, then I see a soft warning suggesting more detail
- Given my answer contains solution language ("app that does X"), when I submit Q2, then I see a flag warning me to focus on the problem

**Priority:** 🔴 High | **Effort:** M | **Persona:** Alex, Sarah

---

### US-INIT-02: Compare Multiple Ideas

```
As a solo founder (Sarah)
I want to run `loopkit init` on 3 different ideas
So that I can compare their scores and pick the best one to pursue
```

**Acceptance Criteria:**

- Given I have 3 saved briefs, when I list them, then I see each with its overall score
- Given I pick the highest-scoring idea, when I set it as active, then `loopkit track` uses it by default

**Priority:** 🟡 Medium | **Effort:** S | **Persona:** Sarah, Marcus

---

### US-INIT-03: Resume After Interruption

```
As a side project shipper (Jordan)
I want to resume `loopkit init` after pressing Ctrl+C
So that I don't lose my progress if I get interrupted
```

**Acceptance Criteria:**

- Given I answered 3 of 5 questions and pressed Ctrl+C, when I run `loopkit init` again, then I'm asked whether to resume or start over
- Given I choose to resume, when the command continues, then I see my previous answers and continue from question 4

**Priority:** 🔴 High | **Effort:** S | **Persona:** Jordan

---

### US-INIT-04: Validate Without AI

```
As a free-tier user
I want to complete `loopkit init` even when the AI is unavailable
So that I can still structure my thinking without paying
```

**Acceptance Criteria:**

- Given my API key is missing and I have no auth token, when I run `loopkit init`, then I can still answer all questions and save a brief without scores
- Given the AI service is down, when I complete the flow, then my answers are saved and I see a message to run `--analyze` later

**Priority:** 🟡 Medium | **Effort:** S | **Persona:** All

---

### US-INIT-05: Get a Clear Validation Plan

```
As a first-time founder (Alex)
I want the AI to tell me the riskiest assumption and how to validate it
So that I know exactly what to do in my first week
```

**Acceptance Criteria:**

- Given I complete `loopkit init`, when the brief is generated, then it includes a "Riskiest Assumption" section
- Given I read the brief, when I look at "Validate Before You Build", then I see 1-3 concrete actions I can take this week

**Priority:** 🔴 High | **Effort:** S | **Persona:** Alex, Sarah

---

## Phase 2: Develop (`loopkit track`)

### US-TRACK-01: See My Weekly Progress

```
As a solo founder (Sarah)
I want to run `loopkit track` and see what I've done this week
So that I know if I'm on track or falling behind
```

**Acceptance Criteria:**

- Given I have a tasks.md file with done and open tasks, when I run `loopkit track`, then I see a board with ✓ done and ○ open tasks
- Given I have completed tasks, when the board renders, then I see a shipping score progress bar (done/total × 100)

**Priority:** 🔴 High | **Effort:** S | **Persona:** All

---

### US-TRACK-02: Close Tasks via Git Commits

```
As an indie hacker (Marcus)
I want my commit messages to automatically close tasks
So that I don't have to manually update tasks.md every time
```

**Acceptance Criteria:**

- Given the git hook is installed, when I commit with message `[#3] Fix auth bug`, then task #3 is marked as done in tasks.md
- Given I commit with `[#2] [#4] Update docs`, when the hook runs, then both tasks #2 and #4 are closed

**Priority:** 🔴 High | **Effort:** M | **Persona:** Marcus, Sarah

---

### US-TRACK-03: Handle Stale Tasks

```
As a solo founder (Sarah)
I want stale tasks (3+ days old) to be flagged
So that I decide whether to keep working on them, snooze them, or cut them
```

**Acceptance Criteria:**

- Given a task has been open for 4 days, when I run `loopkit track`, then I see a stale task alert
- Given I see the stale alert, when I interact with it, then I can choose: keep / snooze (pick date) / cut (moves to cut.md)
- Given I cut a task, when I check cut.md, then the task is preserved with the cut date (never deleted)

**Priority:** 🟡 Medium | **Effort:** M | **Persona:** Sarah, Jordan

---

### US-TRACK-04: Add Tasks Quickly

```
As an indie hacker (Marcus)
I want to add a task without opening an editor
So that I can capture ideas instantly
```

**Acceptance Criteria:**

- Given I run `loopkit track --add "Implement OAuth"`, when the command completes, then the task appears in tasks.md with a sequential ID and today's date
- Given I run `loopkit track --add` with no argument, when the command runs, then it opens $EDITOR for multi-line input

**Priority:** 🟡 Medium | **Effort:** S | **Persona:** Marcus

---

### US-TRACK-05: Switch Between Projects

```
As an indie hacker (Marcus)
I want to switch my active project from the CLI
So that I can manage multiple projects without editing config.json
```

**Acceptance Criteria:**

- Given I have 3 projects, when I run `loopkit track --project other-project`, then the active project switches
- Given I switch projects, when I run `loopkit track` next, then I see the tasks for the newly active project

**Priority:** 🟡 Medium | **Effort:** S | **Persona:** Marcus

---

### US-TRACK-06: Repair Broken IDs

```
As a side project shipper (Jordan)
I want to fix broken task IDs after manual editing
So that my task numbering stays consistent
```

**Acceptance Criteria:**

- Given I manually edited tasks.md and created duplicate IDs, when I run `loopkit track --repair`, then all IDs are re-sequenced from #1

**Priority:** 🟢 Low | **Effort:** S | **Persona:** Jordan

---

## Phase 3: Deliver (`loopkit ship`)

### US-SHIP-01: Generate Launch Copy

```
As a solo founder (Sarah)
I want AI to write my launch posts for HN, Twitter, and IH
So that I can launch in 10 minutes instead of 2 hours
```

**Acceptance Criteria:**

- Given I have a brief.json, when I run `loopkit ship`, then I see drafts for HN (title+body), Twitter (3 tweets), and IH (narrative)
- Given I read the HN draft, when I evaluate it, then it follows HN conventions (no hype, developer tone, clear value prop)

**Priority:** 🔴 High | **Effort:** M | **Persona:** Sarah, Marcus

---

### US-SHIP-02: Edit Drafts in My Editor

```
As an indie hacker (Marcus)
I want to edit AI-generated drafts in my preferred editor
So that I can add my personal voice before posting
```

**Acceptance Criteria:**

- Given I see the draft selection screen, when I press `[e]dit`, then the draft opens in $EDITOR (or nano as fallback)
- Given I save and exit the editor, when I return to LoopKit, then I see my edited version and can choose to use it

**Priority:** 🟡 Medium | **Effort:** S | **Persona:** Marcus

---

### US-SHIP-03: Save Ship History

```
As a solo founder (Sarah)
I want my ship logs saved automatically
So that I can look back at what I launched and when
```

**Acceptance Criteria:**

- Given I complete `loopkit ship`, when the command finishes, then a log is saved to `.loopkit/ships/YYYY-MM-DD.md`
- Given I ship on the same day twice, when the second ship completes, then I'm asked: overwrite / append / skip

**Priority:** 🟡 Medium | **Effort:** S | **Persona:** Sarah

---

### US-SHIP-04: Ship Without a Brief

```
As a side project shipper (Jordan)
I want to use `loopkit ship` even if I skipped `loopkit init`
So that I can launch quick experiments without full documentation
```

**Acceptance Criteria:**

- Given I have no brief.json, when I run `loopkit ship`, then I'm asked 2-3 inline questions for context
- Given I answer the questions, when the AI generates drafts, then they use my answers as context

**Priority:** 🟡 Medium | **Effort:** S | **Persona:** Jordan

---

## Phase 4: Feedback (`loopkit pulse`)

### US-PULSE-01: Collect Feedback via Shareable Link

```
As a solo founder (Sarah)
I want to generate a shareable feedback URL from the CLI
So that I can collect structured feedback without building a form
```

**Acceptance Criteria:**

- Given I run `loopkit pulse --share`, when the command completes, then I see a URL and a QR code in the terminal
- Given I share the URL, when someone visits it, then they see a branded feedback form
- Given someone submits feedback, when I check the dashboard, then their response appears in real-time

**Priority:** 🔴 High | **Effort:** M | **Persona:** Sarah, Alex

---

### US-PULSE-02: Add Feedback Inline

```
As an indie hacker (Marcus)
I want to quickly add feedback I received via DM or email
So that I don't lose insights that come through random channels
```

**Acceptance Criteria:**

- Given I run `loopkit pulse --add "User said X"`, when the command completes, then the response is appended to my collection
- Given I have < 5 responses, when I run `loopkit pulse`, then I see raw responses with a message that I need 5 for clustering

**Priority:** 🟡 Medium | **Effort:** S | **Persona:** Marcus

---

### US-PULSE-03: AI Clustering of Feedback

```
As a solo founder (Sarah)
I want AI to group my feedback into actionable clusters
So that I know what to fix now vs. validate later
```

**Acceptance Criteria:**

- Given I have ≥ 5 responses, when I run `loopkit pulse`, then I see 3 clusters: "Fix now", "Validate later", "Noise"
- Given a cluster is generated, when I read it, then I see: count, pattern description, and 2-3 representative quotes
- Given the AI generates clusters, when I evaluate them, then the quotes are real (never invented)

**Priority:** 🔴 High | **Effort:** M | **Persona:** Sarah, Alex

---

### US-PULSE-04: Tag Feedback to Sprint

```
As a solo founder (Sarah)
I want to tag a "Fix now" item directly to my task list
So that feedback turns into action immediately
```

**Acceptance Criteria:**

- Given I see a "Fix now" cluster, when I confirm "Tag to sprint?", then a new task is added to my tasks.md
- Given the task is added, when I run `loopkit track`, then I see the new task with a note that it came from pulse

**Priority:** 🟡 Medium | **Effort:** S | **Persona:** Sarah

---

### US-PULSE-05: Embed Feedback Widget

```
As a solo founder (Sarah)
I want to embed a feedback widget on my landing page
So that visitors can give feedback without leaving my site
```

**Acceptance Criteria:**

- Given I run `loopkit pulse --share`, when I see the output, then it includes a `<script>` tag for embedding
- Given I embed the script, when a user clicks the feedback button, then a modal opens with the feedback form
- Given the user is offline, when they submit feedback, then Convex queues it and syncs when they're back online

**Priority:** 🟡 Medium | **Effort:** M | **Persona:** Sarah

---

## Phase 5: Iterate (`loopkit loop`)

### US-LOOP-01: Weekly Synthesis Ritual

```
As a side project shipper (Jordan)
I want a Sunday ritual that synthesizes my week
So that I know exactly what to focus on next week
```

**Acceptance Criteria:**

- Given it's Sunday and I have loop data, when I run `loopkit loop`, then AI generates "The One Thing" I should focus on next week
- Given the synthesis is generated, when I read it, then it follows priority logic: Fix now → Ship → Validate → Next task

**Priority:** 🔴 High | **Effort:** M | **Persona:** Jordan, Sarah

---

### US-LOOP-02: Tension Detection

```
As a solo founder (Sarah)
I want to know when my pulse feedback contradicts my track plan
So that I don't ignore critical user feedback
```

**Acceptance Criteria:**

- Given I have a "Fix now" pulse item and my tasks don't address it, when I run `loopkit loop`, then the synthesis includes a "Tension" section highlighting the conflict
- Given I see the tension, when I review it, then I can choose to accept the AI's recommendation or override it with a reason

**Priority:** 🟡 Medium | **Effort:** M | **Persona:** Sarah

---

### US-LOOP-03: Override Tracking

```
As an indie hacker (Marcus)
I want to override the AI's recommendation with my own judgment
So that I maintain agency while still getting the system's perspective
```

**Acceptance Criteria:**

- Given I disagree with the AI recommendation, when I choose "Change", then I can enter my own priority and reason
- Given I override, when the loop log is saved, then the override and reason are recorded
- Given I override > 50% of the time for 4 weeks, when I run `loopkit loop`, then I see a gentle warning about my override rate

**Priority:** 🟡 Medium | **Effort:** S | **Persona:** Marcus

---

### US-LOOP-04: Streak Visualization

```
As a side project shipper (Jordan)
I want to see my consecutive week streak
So that I stay motivated to maintain my shipping habit
```

**Acceptance Criteria:**

- Given I have run `loopkit loop` for 4 consecutive weeks, when I run it again, then I see a "4-Week Streak" indicator
- Given I break my streak, when I run `loopkit loop` after missing a week, then I see my streak reset to 0 with a friendly message

**Priority:** 🟢 Low | **Effort:** S | **Persona:** Jordan

---

### US-LOOP-05: First-Week Handling

```
As a first-time founder (Alex)
I want `loopkit loop` to work in my first week even without historical data
So that I can start the ritual immediately
```

**Acceptance Criteria:**

- Given it's my first week and I have no loop logs, when I run `loopkit loop`, then I'm asked 2 inline questions instead of relying on AI synthesis
- Given I answer the questions, when the loop completes, then a log is saved and I see "nextStep('init')" guidance

**Priority:** 🟡 Medium | **Effort:** S | **Persona:** Alex

---

## Cross-Cutting Stories

### US-AUTH-01: Authenticate Once, Use Everywhere

```
As a solo founder (Sarah)
I want to log in once via the CLI and stay authenticated
So that I don't have to manage API keys manually
```

**Acceptance Criteria:**

- Given I run `loopkit auth`, when I complete the browser flow, then my token is saved (encrypted) to config.json
- Given I'm authenticated, when I run any AI-powered command, then it uses my token seamlessly
- Given my token expires, when I make an API call, then I see a friendly message: "Your session expired. Run `loopkit auth` to log in again."

**Priority:** 🔴 High | **Effort:** M | **Persona:** All

---

### US-TIER-01: Understand My Plan Limits

```
As a free-tier user
I want to know when I'm hitting my AI usage limit
So that I can decide whether to upgrade or wait
```

**Acceptance Criteria:**

- Given I'm on the free tier and I've used 8/10 AI calls today, when I make another AI call, then I see: "You have 2 AI calls remaining today. Upgrade for unlimited."
- Given I hit the limit, when I try another AI call, then I see: "Rate limit exceeded: 10/10 AI calls today. Upgrade for more."

**Priority:** 🟡 Medium | **Effort:** S | **Persona:** All

---

### US-TRACK-07: Project Collision Handling

```
As an indie hacker (Marcus)
I want to handle naming conflicts when creating a new project
So that I don't accidentally overwrite existing work
```

**Acceptance Criteria:**

- Given a project "saas" already exists, when I run `loopkit init saas`, then I see options: overwrite / create new version / resume existing
- Given I choose "create new version", when the init completes, then the project is saved as "saas-v2" or similar

**Priority:** 🟡 Medium | **Effort:** S | **Persona:** Marcus

---

### US-PULSE-06: Graceful Fallback When AI Fails

```
As a solo founder (Sarah)
I want LoopKit to keep working even when the AI service is down
So that I'm never completely blocked
```

**Acceptance Criteria:**

- Given the AI service is unavailable, when I run `loopkit pulse` with ≥ 5 responses, then I see the raw responses instead of crashing
- Given AI fails during `loopkit ship`, when the error is caught, then my ship log is still saved with what I manually entered
- Given any AI error, when it occurs, then I see a friendly fallback message, not a stack trace

**Priority:** 🔴 High | **Effort:** S | **Persona:** All

---

### US-INIT-06: Session Resume After Ctrl+C

```
As a side project shipper (Jordan)
I want to safely exit any prompt with Ctrl+C without losing data
So that I feel confident using LoopKit in any context
```

**Acceptance Criteria:**

- Given I'm in the middle of any prompt, when I press Ctrl+C, then the CLI exits gracefully
- Given I was in `loopkit init`, when I press Ctrl+C after question 3, then my partial answers are saved to draft.json
- Given I resume later, when I choose to continue, then I start from where I left off

**Priority:** 🔴 High | **Effort:** S | **Persona:** All

---

## Story → Feature Mapping

| Feature     | Stories Covered                     | Primary Personas | Priority |
| ----------- | ----------------------------------- | ---------------- | -------- |
| `init`      | US-INIT-01, 02, 03, 04, 05, 06      | Alex, Sarah      | 🔴       |
| `track`     | US-TRACK-01, 02, 03, 04, 05, 06, 07 | All              | 🔴       |
| `ship`      | US-SHIP-01, 02, 03, 04              | Sarah, Marcus    | 🔴       |
| `pulse`     | US-PULSE-01, 02, 03, 04, 05, 06     | Sarah, Alex      | 🔴       |
| `loop`      | US-LOOP-01, 02, 03, 04, 05          | Jordan, Sarah    | 🔴       |
| `auth`      | US-AUTH-01                          | All              | 🔴       |
| Tier gating | US-TIER-01                          | All              | 🟡       |

---

## Definition of Done (Per Story)

- [ ] Story acceptance criteria are all met
- [ ] Edge cases from SCENARIOS.md are handled
- [ ] Ctrl+C exits gracefully at every prompt
- [ ] AI failure has a graceful fallback
- [ ] Free vs paid tier behavior is correct
- [ ] `pnpm --filter @loopkit/cli build` → 0 errors
- [ ] Web changed? → `npx next build` → clean
- [ ] Tests pass: `pnpm --filter @loopkit/cli test` + `pnpm --filter @loopkit/web test` + `pnpm --filter @loopkit/shared test`

---

_Last updated: April 2026_
