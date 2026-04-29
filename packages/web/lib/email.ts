import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface MilestoneEmailData {
  email: string;
  milestoneType: string;
  metadata?: Record<string, unknown>;
}

const MILESTONE_EMAIL_TEMPLATES: Record<string, { subject: string; body: string }> = {
  week_1_complete: {
    subject: "🎉 You shipped your first week with LoopKit",
    body: `You shipped your first week. 70% of founders quit by week 2. You're in the top 30%.

Keep this momentum going. Run \`loopkit loop\` every Sunday to stay on track.

— The LoopKit Team`,
  },
  week_4_complete: {
    subject: "🎉 One month straight! Your pattern analysis",
    body: `One month straight. Here's your pattern analysis — check your shipping DNA in the LoopKit dashboard.

Consistency is your superpower. Keep shipping.

— The LoopKit Team`,
  },
  first_revenue: {
    subject: "💰 First revenue signal! You're in business",
    body: `First revenue signal! You've crossed the chasm from builder to business.

This is a huge milestone. Track your revenue with \`loopkit revenue\` to see your growth.

— The LoopKit Team`,
  },
  streak_break: {
    subject: "📊 You missed a week. Get back in the game!",
    body: `You missed a week. 47 other founders ran loopkit loop yesterday.

Don't worry — streaks reset. What matters is getting back in the game. Run \`loopkit loop\` this Sunday.

— The LoopKit Team`,
  },
  pricing_signal: {
    subject: "🎯 Pulse feedback: Time to charge?",
    body: `Pulse feedback mentions 'pricing' 3 times — time to charge for what you've built.

Your users are asking to pay. Don't leave money on the table.

— The LoopKit Team`,
  },
};

export async function sendMilestoneEmail(data: MilestoneEmailData): Promise<void> {
  const { email, milestoneType, metadata } = data;
  const template = MILESTONE_EMAIL_TEMPLATES[milestoneType];

  if (!template) {
    console.error(`Unknown milestone type: ${milestoneType}`);
    return;
  }

  try {
    await resend.emails.send({
      from: 'LoopKit <noreply@loopkit.dev>',
      to: email,
      subject: template.subject,
      text: template.body,
    });
  } catch (error) {
    console.error('Failed to send milestone email:', error);
  }
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  try {
    await resend.emails.send({
      from: 'LoopKit <noreply@loopkit.dev>',
      to: params.to,
      subject: params.subject,
      text: params.text,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}
