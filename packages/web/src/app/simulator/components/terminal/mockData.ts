export const SAMPLE_PROJECT = {
  name: "ProposalAI",
  slug: "proposalai",
  answers: {
    name: "ProposalAI",
    problem:
      "Freelancers spend 2-3 hours writing proposals for each client. Most proposals are repetitive but need customization.",
    icp: "Freelance designers and developers charging $3K+ per project",
    whyUnsolved:
      "Existing tools are enterprise-focused ($50+/mo). Freelancers use Google Docs and copy-paste.",
    mvp: "A web app that generates custom proposals from a template + project details in under 2 minutes",
  },
  scores: { icp: 8, problem: 9, mvp: 7, overall: 8 },
  riskiestAssumption:
    '"Clients prefer AI-generated proposals over handwritten ones — may not be true."',
  validationAction:
    '"Send 5 AI-generated proposals and 5 handwritten ones. Compare response rates."',
};

export const SAMPLE_TEMPLATE_TASKS = [
  { title: "Set up Next.js project with auth", createdAt: "2026-04-21" },
  { title: "Design proposal template editor", createdAt: "2026-04-21" },
  { title: "Implement AI generation endpoint", createdAt: "2026-04-21" },
  { title: "Build proposal preview page", createdAt: "2026-04-21" },
  { title: "Set up Stripe for payments", createdAt: "2026-04-21" },
  { title: "Create landing page", createdAt: "2026-04-21" },
  { title: "Add PDF export", createdAt: "2026-04-21" },
  { title: "Implement client tracking", createdAt: "2026-04-21" },
];

export const SAMPLE_SHIP_DRAFTS = {
  hn: {
    title:
      "Show HN: ProposalAI – Generate custom client proposals in under 2 minutes",
    body: `I'm a freelancer who was tired of spending 2-3 hours on every proposal. Most of the content was the same — just reworded for each client.\n\nSo I built ProposalAI. It takes your project details and generates a custom proposal in under 2 minutes.\n\nHow it works:\n1. Define your service templates (design, development, consulting)\n2. Enter client details and project scope\n3. AI generates a professional proposal with pricing, timeline, and deliverables\n4. Export as PDF or share via link\n\nIt's aimed at freelancers and small agencies who want to look professional without spending hours on paperwork.\n\nCurrently in beta. Would love feedback from the HN community — especially if you've struggled with proposal writing.`,
  },
  twitter: {
    tweets: [
      "I spent 2-3 hours writing every proposal as a freelancer. Same structure, different client. So I built ProposalAI — generates custom proposals in under 2 minutes. Now in beta.",
      "The problem: enterprise proposal tools cost $50+/mo and are built for sales teams. Freelancers just need something fast that looks professional. That's what ProposalAI does.",
      "If you're a freelancer who hates writing proposals, I'd love your feedback. Early beta, free to try. DMs open.",
    ],
  },
  ih: {
    body: `Hey Indie Hackers!\n\nI've been freelancing for 3 years and the thing I hated most was writing proposals. Every time a new lead came in, I'd spend 2-3 hours crafting a custom proposal — even though 80% of the content was the same.\n\nI looked at tools like PandaDoc and Proposify, but they're $50+/mo and built for sales teams with approval workflows and CRM integrations. Way too heavy for a solo freelancer.\n\nSo I built ProposalAI. It's simple:\n- Define your service templates once\n- Enter client details for each project\n- AI generates a professional proposal with pricing, timeline, and deliverables\n- Export as PDF or share via link\n\nCurrently in beta with 15 freelancers testing it. Early feedback is promising — average proposal time went from 2.5 hours to 8 minutes.\n\nWould love to hear from other freelancers: How do you handle proposals? What would make your ideal proposal tool?`,
  },
};

export const SAMPLE_PULSE_RESPONSES = [
  "The template editor is confusing — I couldn't figure out how to add custom sections",
  "I wish I could export proposals as PDF",
  "The AI-generated pricing feels too generic for my industry",
  "Love the concept! Would be perfect with Notion integration",
  "The preview page doesn't look great on mobile",
  "Can I share proposals with a public link instead of PDF?",
  "The onboarding flow is smooth, great first impression",
  "I need to track which clients opened my proposal",
];

export const SAMPLE_PULSE_CLUSTERS = [
  {
    label: "Fix now",
    count: 3,
    pattern: "Template editor UX is confusing",
    quotes: [
      '"I couldn\'t figure out how to add custom sections"',
      '"The editor needs a better toolbar"',
      '"Drag and drop would make this 10x better"',
    ],
  },
  {
    label: "Validate later",
    count: 3,
    pattern: "Requests for integrations and export",
    quotes: [
      '"Would be perfect with Notion integration"',
      '"I need to track which clients opened my proposal"',
      '"Can I share proposals with a public link?"',
    ],
  },
  {
    label: "Noise",
    count: 2,
    pattern: "General praise and minor UI issues",
    quotes: [
      '"Love the concept!"',
      '"The preview page doesn\'t look great on mobile"',
    ],
  },
];

export const SAMPLE_RADAR_LAUNCHES = [
  {
    name: "Proposa.ly",
    url: "https://producthunt.com/posts/proposa-ly",
    date: "2026-04-25",
    platform: "Product Hunt",
    relevance: 85,
    tagline: "AI proposals for freelancers",
  },
  {
    name: "PitchPerfect",
    url: "https://news.ycombinator.com/item?id=12345",
    date: "2026-04-23",
    platform: "Hacker News",
    relevance: 72,
    tagline: "Automated pitch deck generation",
  },
  {
    name: "QuoteGen",
    url: "https://producthunt.com/posts/quotegen",
    date: "2026-04-22",
    platform: "Product Hunt",
    relevance: 65,
    tagline: "Instant quotes for service businesses",
  },
  {
    name: "DocFlow",
    url: "https://news.ycombinator.com/item?id=12346",
    date: "2026-04-20",
    platform: "Hacker News",
    relevance: 48,
    tagline: "Document automation for teams",
  },
  {
    name: "InvoiceHero",
    url: "https://producthunt.com/posts/invoicehero",
    date: "2026-04-19",
    platform: "Product Hunt",
    relevance: 35,
    tagline: "Smart invoicing for freelancers",
  },
];

export const SAMPLE_KEYWORDS = [
  {
    keyword: "freelance proposal template",
    score: 82,
    volume: "high",
    competition: "low",
    sources: ["Google", "Reddit"],
  },
  {
    keyword: "proposal generator tool",
    score: 75,
    volume: "medium",
    competition: "low",
    sources: ["Google", "GitHub"],
  },
  {
    keyword: "AI proposal writer",
    score: 71,
    volume: "medium",
    competition: "medium",
    sources: ["Google"],
  },
  {
    keyword: "client proposal software",
    score: 68,
    volume: "medium",
    competition: "medium",
    sources: ["Google", "Reddit"],
  },
  {
    keyword: "freelance contract template",
    score: 64,
    volume: "high",
    competition: "high",
    sources: ["Google"],
  },
  {
    keyword: "how to write a project proposal",
    score: 58,
    volume: "high",
    competition: "high",
    sources: ["Google", "Reddit"],
  },
  {
    keyword: "proposal automation",
    score: 55,
    volume: "low",
    competition: "low",
    sources: ["GitHub"],
  },
  {
    keyword: "small business proposal tool",
    score: 52,
    volume: "medium",
    competition: "medium",
    sources: ["Google"],
  },
];

export const SAMPLE_TIMING = {
  compositeScore: 72,
  signal: "Heating" as const,
  fundingTrend: "↑" as const,
  fundingCount: 3,
  devTrend: "↑" as const,
  devGrowth: 12,
  hiringTrend: "→" as const,
  hiringCount: 45,
};

export const SAMPLE_COACHING_MOMENTS = [
  {
    id: "week3-ship",
    priority: "warning" as const,
    title: "Week 3 Milestone",
    message:
      "You've been validating for 3 weeks. 73% of founders who ship by week 4 reach revenue.",
    action: "Ship anything this week — even if it's imperfect.",
    command: "loopkit ship",
  },
  {
    id: "template-confusion",
    priority: "info" as const,
    title: "Feedback Pattern Detected",
    message:
      "3/8 pulse responses mention template editor confusion. This is your #1 blocker.",
    action: "Prioritize template UX in your next sprint.",
    command: "loopkit track",
  },
  {
    id: "shipping-streak",
    priority: "info" as const,
    title: "Shipping Momentum",
    message:
      "You've shipped 2 weeks in a row. Consistency compounds — keep going.",
    action: "Plan your next ship for Friday.",
  },
];
