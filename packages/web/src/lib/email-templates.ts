/**
 * Email templates for the Sunday digest.
 *
 * Plain template-literal HTML — no React Email / MJML dep needed.
 * Keep it readable. The subject is generated in email.ts.
 *
 * Style note: we use inline styles (email clients are stuck in 2007)
 * and a single-column layout that renders on Gmail, Outlook, Apple Mail.
 */

interface DigestData {
  userEmail: string;
  userName: string;
  productName: string;
  weekNumber: number;
  tasksDone: number;
  tasksTotal: number;
  shippingScore: number;
  streak: number;
  oneThing: string | null;
  nextSteps: string[];
  dashboardUrl: string;
  unsubscribeUrl: string;
  yearCardUrl: string;
}

const COLORS = {
  bg: "#0c0c0f",
  card: "#18181b",
  border: "#27272a",
  text: "#fafafa",
  muted: "#a1a1aa",
  primary: "#7C3AED",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
};

function scoreColor(score: number): string {
  if (score >= 80) return COLORS.success;
  if (score >= 60) return COLORS.primary;
  if (score >= 40) return COLORS.warning;
  return COLORS.danger;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderDigestHtml(d: DigestData): string {
  const safeProduct = escapeHtml(d.productName);
  const safeName = escapeHtml(d.userName);
  const safeOneThing = d.oneThing ? escapeHtml(d.oneThing) : null;
  const safeDashboard = escapeHtml(d.dashboardUrl);
  const safeUnsub = escapeHtml(d.unsubscribeUrl);
  const safeYear = escapeHtml(d.yearCardUrl);

  const scoreBar = `
    <div style="background:${COLORS.bg};border:1px solid ${COLORS.border};border-radius:8px;height:8px;overflow:hidden;margin-top:6px;">
      <div style="background:${scoreColor(d.shippingScore)};height:100%;width:${d.shippingScore}%;"></div>
    </div>`;

  const streakBadge = d.streak >= 4
    ? `<span style="display:inline-block;background:rgba(249,115,22,0.15);color:#fb923c;border:1px solid rgba(249,115,22,0.3);padding:2px 8px;border-radius:99px;font-size:12px;font-weight:600;margin-left:6px;">🔥 ${d.streak} streak</span>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Week ${d.weekNumber} recap</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${COLORS.text};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.bg};">
  <tr>
    <td align="center" style="padding:40px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

        <tr>
          <td style="padding-bottom:24px;">
            <div style="color:${COLORS.muted};font-size:12px;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">
              Week ${d.weekNumber} · ${safeProduct}
            </div>
            <h1 style="margin:8px 0 0 0;font-size:24px;font-weight:700;color:${COLORS.text};line-height:1.2;">
              Hi ${safeName}. Here's your week.${streakBadge}
            </h1>
          </td>
        </tr>

        <tr>
          <td>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.card};border:1px solid ${COLORS.border};border-radius:12px;">
              <tr>
                <td style="padding:20px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="33%" style="text-align:center;padding:8px;">
                        <div style="color:${COLORS.muted};font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Tasks</div>
                        <div style="color:${COLORS.text};font-size:22px;font-weight:700;margin-top:4px;">${d.tasksDone}/${d.tasksTotal}</div>
                      </td>
                      <td width="33%" style="text-align:center;padding:8px;">
                        <div style="color:${COLORS.muted};font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Score</div>
                        <div style="color:${scoreColor(d.shippingScore)};font-size:22px;font-weight:700;margin-top:4px;">${d.shippingScore}%</div>
                        ${scoreBar}
                      </td>
                      <td width="33%" style="text-align:center;padding:8px;">
                        <div style="color:${COLORS.muted};font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Streak</div>
                        <div style="color:${COLORS.text};font-size:22px;font-weight:700;margin-top:4px;">${d.streak}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${
          safeOneThing
            ? `<tr>
          <td style="padding-top:20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.card};border:1px solid ${COLORS.border};border-radius:12px;">
              <tr>
                <td style="padding:20px;">
                  <div style="color:${COLORS.muted};font-size:11px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;margin-bottom:8px;">Your one thing</div>
                  <p style="margin:0;color:${COLORS.text};font-size:16px;line-height:1.5;font-style:italic;">"${safeOneThing}"</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
            : ""
        }

        <tr>
          <td style="padding-top:24px;text-align:center;">
            <a href="${safeDashboard}" style="display:inline-block;background:${COLORS.primary};color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">
              Open your dashboard
            </a>
          </td>
        </tr>

        <tr>
          <td style="padding-top:24px;">
            <a href="${safeYear}" style="display:block;background:${COLORS.card};border:1px solid ${COLORS.border};border-radius:12px;padding:16px 20px;text-decoration:none;color:${COLORS.text};">
              <div style="font-size:13px;font-weight:600;margin-bottom:4px;">View your ${new Date().getFullYear()} year-in-review →</div>
              <div style="font-size:12px;color:${COLORS.muted};">See your shipping heatmap, archetype, and biggest moments. Screenshot-ready.</div>
            </a>
          </td>
        </tr>

        <tr>
          <td style="padding-top:32px;border-top:1px solid ${COLORS.border};text-align:center;">
            <p style="margin:16px 0 0 0;color:${COLORS.muted};font-size:11px;line-height:1.5;">
              You're receiving this because you have an active LoopKit project.<br>
              <a href="${safeUnsub}" style="color:${COLORS.muted};text-decoration:underline;">Unsubscribe</a> · <a href="${safeDashboard}" style="color:${COLORS.muted};text-decoration:underline;">Open dashboard</a>
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
