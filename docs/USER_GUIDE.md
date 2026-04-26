# LoopKit User Guide

> **The Solo Founder's Shipping OS**
>
> Define · Develop · Deliver · Learn · Repeat

---

## What Is LoopKit?

LoopKit is a command-line tool that helps solo founders ship products consistently. It closes the entire product loop — from idea to launch to feedback to iteration — in one lightweight workflow.

If you've ever:
- Started a project and abandoned it at 80%
- Built something nobody wanted
- Felt overwhelmed by scattered tools (Notion, Trello, Twitter, email)
- Struggled to write launch copy
- Lost track of what to work on next

...LoopKit is for you.

---

## The Philosophy

LoopKit is built on one belief: **Shipping is a skill, not a talent.** And like any skill, it improves with practice and a system.

Most founders fail not because they can't code, but because they:
1. Don't validate before building
2. Don't ship consistently
3. Don't learn from feedback
4. Don't iterate based on what they learned

LoopKit forces you to do all four, every single week.

---

## The 5-Phase Loop

Every successful product follows this loop. LoopKit makes it explicit and automatic.

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  DEFINE │ → │ DEVELOP │ → │ DELIVER │ → │  LEARN  │ → │ ITERATE │
│  (init) │    │ (track) │    │  (ship) │    │ (pulse) │    │  (loop) │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
     ↑___________________________________________________________|
```

### Phase 1: DEFINE (`loopkit init`)
**Question:** *What should I build?*

Before you write a single line of code, LoopKit forces you to answer 5 questions:
1. What are you building? (one-liner)
2. What problem does it solve? (be specific)
3. Who is your ideal customer? (the narrower, the better)
4. Why hasn't this been solved? (your insight)
5. What's your MVP? (the smallest version that delivers value)

An AI then scores your answers on three dimensions:
- **ICP Clarity** (1-10): Do you really know who you're building for?
- **Problem Strength** (1-10): Is this a real, painful problem?
- **MVP Focus** (1-10): Is your MVP small enough to ship this month?

**Why this matters:** Most founders build for "everyone" with a "solution looking for a problem." This step prevents that.

**Output:** A `brief.md` file with your bet, scores, riskiest assumption, and a validation plan.

**Time:** 10-15 minutes

---

### Phase 2: DEVELOP (`loopkit track`)
**Question:** *Am I making progress?*

LoopKit replaces your scattered task manager with a simple `tasks.md` file:

```markdown
# MyProject — Tasks

## This Week
- [ ] #1 Set up landing page
- [ ] #2 Configure Stripe
- [ ] #3 Implement auth

## Backlog
- [ ] #4 Add dark mode
- [ ] #5 Write API docs
```

**Magic features:**
- **Auto-close via git:** Write `[#1]` in your commit message → task automatically marks as done
- **Shipping score:** Done tasks / Total tasks × 100. Aim for > 70%.
- **Stale task detection:** Tasks open for 3+ days get flagged. Keep, snooze, or cut them.
- **Never deleted:** Cut tasks move to `cut.md` — you might want them later.

**Why this matters:** Visibility creates accountability. A 60% shipping score is a data point, not a feeling.

**Output:** A clear board showing what's done, what's open, and your momentum.

**Time:** 30 seconds to check, 10 seconds to add a task

---

### Phase 3: DELIVER (`loopkit ship`)
**Question:** *How do I tell the world?*

Shipping isn't just deploying code. It's announcing it to the right people on the right platforms.

LoopKit asks: "What did you ship?" Then AI generates:
- **Hacker News:** Title + body (no hype, developer tone)
- **Twitter:** 3-tweet thread (build in public style)
- **Indie Hackers:** Narrative post (story-driven)

You can use, edit, regenerate, or skip each draft.

**Why this matters:** Writing launch copy takes 1-2 hours. LoopKit does it in 30 seconds. The faster you launch, the faster you learn.

**Output:** Published posts + a `ship log` saved for your records.

**Time:** 5-10 minutes

---

### Phase 4: LEARN (`loopkit pulse`)
**Question:** *What do my users think?*

Most founders build in a vacuum. LoopKit makes feedback collection automatic.

**Two ways to collect:**
1. **Inline:** `loopkit pulse --add "User said the pricing is confusing"`
2. **Shareable form:** `loopkit pulse --share` → get a URL + QR code → embed on your site

Once you have 5+ responses, AI clusters them into:
- **Fix now** (critical issues)
- **Validate later** (ideas to explore)
- **Noise** (outliers and off-topic feedback)

**Why this matters:** 12 random DMs become 3 clear priorities. Data beats intuition.

**Output:** Clustered feedback with representative quotes (never invented).

**Time:** 2 minutes to set up, 10 seconds to analyze

---

### Phase 5: ITERATE (`loopkit loop`)
**Question:** *What should I do next week?*

Every Sunday, LoopKit synthesizes your week:
- Tasks completed vs. planned
- What you shipped
- Feedback received
- Your shipping streak

Then AI recommends **The One Thing** to focus on next week, following this priority:
1. **Fix now** (critical user issues)
2. **Ship** (finish what's almost done)
3. **Validate** (test your riskiest assumption)
4. **Next task** (whatever's next in your plan)

You can accept it, change it, or skip it. Your choice is recorded.

**Why this matters:** The hardest part of every week is deciding what to work on. LoopKit decides for you — based on data, not mood.

**Output:** A loop log + a build-in-public post you can share.

**Time:** 2 minutes

---

## Your First Week with LoopKit

### Day 1 (Monday): Define
```bash
loopkit init my-project
# Answer the 5 questions
# Get your scored brief
```

### Day 2-4 (Tue-Thu): Develop
```bash
loopkit track --add "Set up landing page"
# Work, commit with [#1], task auto-closes
loopkit track  # Check your progress
```

### Day 5 (Friday): Deliver
```bash
loopkit ship
# "What did you ship?" → "Landing page with email capture"
# Use AI-generated drafts to announce
```

### Day 6 (Saturday): Learn
```bash
loopkit pulse --share
# Share the link in communities
# Collect responses
```

### Day 7 (Sunday): Iterate
```bash
loopkit loop
# Review your week
# Accept the AI's recommendation
# Share your BIP post
```

**Repeat every week.**

---

## Key Concepts

### The Shipping Score
Your shipping score is `done tasks / total tasks × 100`.

| Score | Meaning |
|-------|---------|
| 90-100% | Crushing it |
| 70-89%  | On track |
| 50-69%  | Falling behind — cut or snooze tasks |
| < 50%   | Stuck — loopkit loop will help |

**Don't aim for 100% every week.** That's a recipe for burnout. Aim for consistency (70%+).

### The Streak
Consecutive weeks where you run `loopkit loop` and close your synthesis.

A 4-week streak means you've shipped and reflected for a month straight. This is the #1 predictor of eventual success.

### The Override
Sometimes you'll disagree with the AI's recommendation. That's fine — override it and record your reason.

But if you're overriding > 50% of the time for a month, ask yourself: *Is the system wrong, or am I avoiding hard truths?*

### Cut vs. Snooze
- **Cut:** "This task is no longer relevant." (Saved to `cut.md` forever)
- **Snooze:** "I'll do this later." (Hidden until the date you pick)

**Rule of thumb:** If a task is stale for 3 days, cut it. If it's important, it will come back.

---

## Tips from Successful Users

### For Consistency
- **Run `loopkit loop` every Sunday at the same time.** Make it a ritual.
- **Set a calendar reminder.** "Sunday 9 AM — LoopKit Loop"
- **Share your BIP post every week.** Public commitment = accountability.

### For Better Scores
- **Break tasks into < 2 hour chunks.** Small tasks get done. Big tasks linger.
- **Front-load your week.** Do hard tasks Monday-Tuesday. Momentum carries you.
- **Use the `--add` flag constantly.** Ideas become tasks in 10 seconds.

### For Better Feedback
- **Share your pulse link in 3 places minimum.** One community isn't enough.
- **Ask specific questions.** "What confused you?" gets better answers than "What do you think?"
- **Respond to feedback publicly.** "Thanks for the feedback, fixing this week!" builds loyalty.

### For Better Briefs
- **Spend 5 extra minutes on the ICP question.** The narrower, the better. "Dentists in Texas" beats "healthcare professionals."
- **If your problem score is < 6, interview 5 potential users before building.**
- **If your MVP score is < 6, cut features until it hurts.**

---

## Pricing

| Plan | Cost | AI | Best For |
|------|------|-----|----------|
| **Free** | $0 | 10 calls/day | Trying LoopKit, side projects |
| **Solo** | $19/mo | 100 calls/day | Serious solo founders |
| **Pro** | $39/mo | Unlimited + BYOK | Power users, multiple projects |

**Free tier includes:** All commands, local storage, basic AI, dashboard read-only.

**Paid tiers add:** Unlimited AI, hosted feedback forms, dashboard full access, team features (coming soon).

---

## Common Questions

**Q: Do I need to be technical to use LoopKit?**
A: You need to be comfortable with the command line. If you can run `npm install` and `git commit`, you can use LoopKit.

**Q: What if I have multiple projects?**
A: `loopkit track --project other-project` switches contexts. Each project has its own brief, tasks, and history.

**Q: Can I use LoopKit with my existing tools?**
A: Yes. LoopKit writes to standard files (`tasks.md`, `brief.md`) that you can edit manually. It complements, not replaces, your IDE and git workflow.

**Q: What happens to my data?**
A: Everything is stored locally in `.loopkit/` (except feedback forms, which use Convex for real-time collection). Your data is yours.

**Q: Does LoopKit work offline?**
A: Mostly. `init`, `track`, and `loop` work fully offline. `ship` and `pulse` need internet for AI features, but your work is saved locally.

**Q: What if the AI gives bad advice?**
A: Override it. The AI is a partner, not a boss. But if you find yourself overriding every week, consider whether you're avoiding hard truths.

---

## The LoopKit Mindset

> "The goal is not to build a perfect product. The goal is to build, learn, and iterate faster than anyone else."

LoopKit is not a todo app. It's not a project manager. It's a **shipping system**.

The difference:
- A todo app helps you organize work.
- A shipping system forces you to finish work, learn from it, and do better next week.

**Your job is not to write code. Your job is to ship value to users.**

LoopKit keeps you honest about that.

---

## Getting Help

- **Documentation:** https://loopkit.dev/docs
- **GitHub:** https://github.com/loopkit/loopkit
- **Twitter:** https://twitter.com/loopkit
- **Email:** support@loopkit.dev

---

*Last updated: April 2026*
