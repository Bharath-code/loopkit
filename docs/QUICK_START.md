# Quick Start Guide

> **Get from zero to shipping in 15 minutes.**

---

## Install

```bash
npm install -g loopkit
```

**Requirements:** Node.js 20+

---

## 1. Define Your Weekly Shipping Bet (Under 5 minutes)

```bash
loopkit init my-project
```

Answer 5 questions. Be specific. The AI will give you the first value fast: one uncomfortable truth, a scored bet, and a validation action you can do tonight.

**Optional flags:**
- `--cron` — Install a Friday reminder cron job (4 PM)
- `--validate` — Run devil's advocate AI to stress-test your brief

**Tip:** If your ICP score is < 7, narrow your target customer. "Freelance designers in Berlin" beats "creative professionals."

---

## 2. Track Your Progress (2 minutes)

```bash
loopkit track --add "Set up landing page"
loopkit track --add "Configure Stripe"
loopkit track --add "Implement auth"
```

Your tasks are saved to `tasks.md`. Commit with `[#1]` in your message to auto-close tasks.

```bash
git commit -m "[#1] Set up landing page with Tailwind"
```

Check progress anytime:
```bash
loopkit track
```

---

## 3. Ship Something (5 minutes)

When you're ready to launch:

```bash
loopkit ship
```

Answer: "What did you ship?"

AI generates launch copy for HN, Twitter, and Indie Hackers. Pick what you like, edit if needed, post.

---

## 4. Collect Feedback (2 minutes)

```bash
loopkit pulse --share
```

Copy the URL. Share it in your communities. Feedback appears in your dashboard.

Add feedback you get via DM:
```bash
loopkit pulse --add "User said onboarding is confusing"
```

When you have 5+ responses, run `loopkit pulse` to see AI-clustered insights.

---

## 5. Iterate on Sunday (3 minutes)

```bash
loopkit loop
```

Review your week. LoopKit shows what moved forward, proof this week (score delta, weeks active, decisions made, feedback acted on), and the AI's recommendation for next week. Share your build-in-public post.

**Optional flag:** `--async` — Run loop any day within a 7-day window without breaking your streak

**Do this every Sunday.** This is the habit that separates founders who ship from founders who don't.

---

## Your First Week Checklist

- [ ] Day 1: `loopkit init` → brief created
- [ ] Day 2-4: 3+ tasks completed (`loopkit track`)
- [ ] Day 5: `loopkit ship` → something public
- [ ] Day 6: `loopkit pulse --share` → feedback collected
- [ ] Day 7: `loopkit loop` → week synthesized, next week planned

**Complete this checklist = you're already ahead of 90% of founders.**

---

## Next Steps

1. **Read the [User Guide](USER_GUIDE.md)** for the full philosophy and tips
2. **Browse [Scenarios](SCENARIOS.md)** to see how others use LoopKit
3. **Check your persona** in [Personas](PERSONAS.md) to see which features matter most for you
4. **Upgrade when ready:** `loopkit auth` → log in → unlock unlimited AI

---

## One-Command Cheatsheet

```bash
# Define
loopkit init my-project
loopkit init --cron                    # Install Friday reminder cron
loopkit init --validate                # Run devil's advocate validation

# Develop
loopkit track                          # View board
loopkit track --add "Task title"       # Add task
loopkit track --project other-project  # Switch project
loopkit track --stand                  # Daily standup (60s)

# Deliver
loopkit ship                           # Generate launch copy

# Learn
loopkit pulse --share                  # Get feedback URL
loopkit pulse --add "Feedback text"    # Add response
loopkit pulse                          # View clusters

# Iterate
loopkit loop                           # Weekly synthesis
loopkit loop --async                  # Run any day within 7-day window

# Celebrate
loopkit celebrate                      # Show shipping score + confetti
loopkit celebrate --share              # Post win to public feed

# Auth
loopkit auth                           # Log in

# Secondary add-ons
loopkit radar                          # Scan PH & HN for competitor launches
loopkit radar --category "saas"        # Scan a specific category
loopkit keywords                       # Find low-competition keywords in your niche
loopkit keywords --category "saas"     # Find keywords for a specific category
loopkit timing                         # Market timing signal for your category
loopkit timing --category "saas"       # Check timing for a specific category
loopkit telemetry on                   # Opt-in to anonymous usage data
loopkit telemetry off                  # Opt-out
loopkit telemetry status               # Check current status

# Utilities
loopkit aliases                        # Manage shell shortcuts
loopkit aliases --remove               # Remove shell shortcuts
loopkit revenue                        # Track MRR milestones
```

---

*Last updated: April 2026 · v0.1.0 (Sharp v1 refinement: fast init, uncomfortable truth, proof loops, Sunday reward, upgrade-intent probes · IE-7 through IE-17 shipped · Phase 13 growth loops: milestones, Friday reminder, validation, aliases, async loop, referral, public wins)*
