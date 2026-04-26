# Quick Start Guide

> **Get from zero to shipping in 15 minutes.**

---

## Install

```bash
npm install -g loopkit
```

**Requirements:** Node.js 20+

---

## 1. Define Your Idea (3 minutes)

```bash
loopkit init my-project
```

Answer 5 questions. Be specific. The AI will score your idea and give you a validation plan.

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

Review your week. Accept the AI's recommendation for next week. Share your build-in-public post.

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

# Develop
loopkit track                          # View board
loopkit track --add "Task title"       # Add task
loopkit track --project other-project  # Switch project

# Deliver
loopkit ship                           # Generate launch copy

# Learn
loopkit pulse --share                  # Get feedback URL
loopkit pulse --add "Feedback text"    # Add response
loopkit pulse                          # View clusters

# Iterate
loopkit loop                           # Weekly synthesis

# Auth
loopkit auth                           # Log in
```

---

*Last updated: April 2026*
