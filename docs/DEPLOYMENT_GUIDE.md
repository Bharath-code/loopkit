# LoopKit Deployment Guide

Complete guide for running LoopKit locally, publishing to npm, and deploying the web dashboard.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Running CLI Locally](#running-cli-locally)
3. [Publishing to npm](#publishing-to-npm)
4. [Deploying Web Dashboard](#deploying-web-dashboard)
5. [Environment Variables](#environment-variables)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js:** 20.0.0 or higher
- **pnpm:** 10.23.0 or higher (`npm install -g pnpm`)
- **Git:** For version control
- **Convex account:** For backend (free tier available)
- **npm account:** For publishing CLI package
- **Vercel account:** For web dashboard deployment (recommended)

---

## Running CLI Locally

### Step 1: Install Dependencies

```bash
# From project root
pnpm install
```

### Step 2: Build Shared Package

The CLI depends on the shared package (schemas):

```bash
pnpm --filter @loopkit/shared build
```

### Step 3: Build CLI

```bash
pnpm --filter @loopkit/cli build
```

### Step 4: Run CLI Directly

```bash
# Using node
node packages/cli/dist/index.js --help

# Or using pnpm
pnpm --filter @loopkit/cli dev
```

### Step 5: Test CLI Commands

```bash
# Initialize a project
node packages/cli/dist/index.js init my-project

# Track tasks
node packages/cli/dist/index.js track --add "Build landing page"

# Check progress
node packages/cli/dist/index.js track
```

### Step 6: (Optional) Install Globally for Development

```bash
# Create symlink for global access
pnpm --filter @loopkit/cli link

# Now you can use:
loopkit --help
loopkit init test-project
```

To unlink later:
```bash
pnpm --filter @loopkit/cli unlink
```

---

## Publishing to npm

### Step 1: Prepare for Publishing

#### Update Version (if needed)

```bash
cd packages/cli
npm version patch  # or minor, or major
```

#### Verify Build

```bash
# From project root
pnpm --filter @loopkit/shared build
pnpm --filter @loopkit/cli build

# Verify the build output
ls -la packages/cli/dist/
```

#### Run Tests

```bash
pnpm --filter @loopkit/cli test
```

### Step 2: Login to npm

```bash
npm login
# Enter your npm username, password, and email
```

### Step 3: Publish Package

```bash
cd packages/cli
npm publish
```

The `prepublishOnly` script will automatically build the package before publishing.

### Step 4: Verify Publication

```bash
# Check if package is live
npm view @loopkit/cli

# Test installation globally
npm install -g @loopkit/cli
loopkit --help
```

### Step 5: Tag Releases (Optional)

```bash
# Tag latest
npm publish --tag latest

# Tag beta for pre-releases
npm publish --tag beta
```

---

## Deploying Web Dashboard

### Option A: Vercel (Recommended)

#### Step 1: Set Up Convex Backend

```bash
# From project root
cd packages/web

# Install Convex CLI (if not installed)
npm install -g convex

# Login to Convex
npx convex login

# Deploy Convex backend
npx convex deploy
```

#### Step 2: Configure Environment Variables

Create `.env.local` in `packages/web/`:

```bash
# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
CONVEX_DEPLOYMENT_KEY=your-deployment-key

# Auth (if using Convex Auth)
NEXT_PUBLIC_CONVEX_AUTH_URL=https://your-project.convex.cloud

# AI (Anthropic)
ANTHROPIC_API_KEY=sk-ant-...

# Analytics (PostHog - optional)
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Email (Resend - optional)
RESEND_API_KEY=re_...
```

#### Step 3: Deploy to Vercel

```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

Follow the prompts:
- **Project name:** `loopkit-web` (or your choice)
- **Build command:** `pnpm build` (or `npm run build`)
- **Output directory:** `.next`
- **Install command:** `pnpm install` (or `npm install`)

#### Step 4: Set Environment Variables in Vercel

Go to your Vercel project dashboard → Settings → Environment Variables and add the same variables from Step 2.

#### Step 5: Deploy to Production

```bash
vercel --prod
```

### Option B: Self-Hosted (Docker)

#### Step 1: Build Docker Image

```bash
cd packages/web
docker build -t loopkit-web .
```

#### Step 2: Run Container

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud \
  -e CONVEX_DEPLOYMENT_KEY=your-key \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  loopkit-web
```

### Option C: Node.js Server

#### Step 1: Build the App

```bash
cd packages/web
pnpm build
```

#### Step 2: Start Production Server

```bash
pnpm start
# App runs on http://localhost:3000
```

#### Step 3: Use PM2 for Process Management

```bash
npm install -g pm2
pm2 start npm --name "loopkit-web" -- start
pm2 save
pm2 startup
```

---

## Environment Variables

### CLI Package (`packages/cli/`)

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes* | Anthropic API key for AI features (*optional for free tier) |
| `LOOPKIT_TELEMETRY` | No | Set to `true` to enable anonymous telemetry |

### Web Package (`packages/web/`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Your Convex deployment URL |
| `CONVEX_DEPLOYMENT_KEY` | Yes | Convex deployment key |
| `ANTHROPIC_API_KEY` | Yes* | Anthropic API key for AI features |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | PostHog analytics key |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | PostHog host URL |
| `RESEND_API_KEY` | No | Resend API key for emails |

---

## Troubleshooting

### CLI Issues

**Issue:** `Cannot find module '@loopkit/shared'`

**Solution:** Build the shared package first:
```bash
pnpm --filter @loopkit/shared build
```

**Issue:** Command not found after global install

**Solution:** Check your npm global bin directory:
```bash
npm config get prefix
# Add $(npm config get prefix)/bin to your PATH
```

**Issue:** AI features not working

**Solution:** Set `ANTHROPIC_API_KEY` in your environment:
```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

### Web Dashboard Issues

**Issue:** Convex connection failed

**Solution:** 
1. Verify `NEXT_PUBLIC_CONVEX_URL` is correct
2. Run `npx convex deploy` to sync backend
3. Check Convex dashboard for deployment status

**Issue:** Build fails on Vercel

**Solution:**
1. Ensure `pnpm` is set as package manager in Vercel settings
2. Add `NEXT_PUBLIC_` prefix to all public environment variables
3. Check build logs for specific errors

**Issue:** Next.js version mismatch

**Solution:** The project uses Next.js 16.2.4 with breaking changes. Ensure you're using the correct version:
```bash
pnpm install next@16.2.4
```

### npm Publishing Issues

**Issue:** Package name already exists

**Solution:** The package name `@loopkit/cli` is scoped. If you don't own the `loopkit` org, use your own scope:
```json
{
  "name": "@your-username/loopkit-cli"
}
```

**Issue:** 403 Forbidden during publish

**Solution:** Ensure you're logged in and have publish permissions:
```bash
npm whoami
npm login
```

---

## Quick Reference Commands

### Local Development

```bash
# Install all dependencies
pnpm install

# Build shared package
pnpm --filter @loopkit/shared build

# Build CLI
pnpm --filter @loopkit/cli build

# Run CLI locally
node packages/cli/dist/index.js --help

# Run web dashboard locally
cd packages/web
pnpm dev
```

### Publishing

```bash
# Build and test
pnpm --filter @loopkit/shared build
pnpm --filter @loopkit/cli build
pnpm --filter @loopkit/cli test

# Publish to npm
cd packages/cli
npm publish
```

### Deployment

```bash
# Deploy Convex backend
cd packages/web
npx convex deploy

# Deploy to Vercel
vercel --prod
```

---

## Post-Deployment Checklist

- [ ] CLI installs via `npm install -g @loopkit/cli`
- [ ] CLI commands work (`loopkit init`, `loopkit track`, etc.)
- [ ] Web dashboard loads at production URL
- [ ] Convex backend is connected and synced
- [ ] Environment variables are set in production
- [ ] AI features work (if API key configured)
- [ ] Auth flow works (if implemented)
- [ ] Analytics are tracking (if configured)

---

*Last updated: April 2026*
