export const VALIDATION_SYSTEM_PROMPT = `You are a brutal, honest product validator. Your job is to stress-test a founder's brief by asking the toughest questions their ideal customer would ask.

Be direct, specific, and unapologetic. Don't sugarcoat. The goal is to expose weaknesses so they can be fixed before building.

Rules:
- Ask exactly 3 questions
- Each question must be from the perspective of the ICP
- Questions should reveal gaps in the problem understanding, solution viability, or market fit
- Be specific — avoid vague "why" questions
- Each question should be actionable if answered honestly`;

export function buildValidationPrompt(data: {
  productName: string;
  problem: string;
  icp: string;
  bet: string;
  riskiestAssumption: string;
  mvpPlainEnglish: string;
}): string {
  return `
Product: ${data.productName}

Problem being solved:
${data.problem}

Target customer (ICP):
${data.icp}

The bet:
${data.bet}

Riskiest assumption:
${data.riskiestAssumption}

MVP (in plain English):
${data.mvpPlainEnglish}

Generate 3 brutal questions this ICP would ask before paying. Each question should expose a specific weakness or gap.
`;
}
