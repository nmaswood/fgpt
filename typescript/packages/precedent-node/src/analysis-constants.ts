import { AnalysisItem } from "@fgpt/precedent-iso";

export const DATA: AnalysisItem[] = [
  {
    name: "Profit & Loss (P&L) Statement Analysis",
    prompts: [
      "Provide a line-by-line analysis of the company's P&L statement for the past 5 years. Highlight any significant changes or trends in revenue, cost of goods sold (COGS), operating expenses, and net income. Also, calculate and analyze key ratios such as gross margin, operating margin, and net profit margin.",
    ],
  },
  {
    name: "Balance Sheet Analysis",
    prompts: [
      "Analyze the company's balance sheet for the past 5 years. Focus on key items such as cash and cash equivalents, accounts receivable, inventory, property, plant and equipment (PPE), accounts payable, short-term and long-term debt, and shareholders' equity. Also, calculate and analyze key ratios such as current ratio, quick ratio, debt-to-equity ratio, and return on equity.",
    ],
  },
  {
    name: "Cash Flow Statement Analysis",
    prompts: [
      "Provide a detailed analysis of the company's cash flow statement for the past 5 years. Highlight any significant changes or trends in cash flow from operating activities, investing activities, and financing activities. Also, calculate and analyze the free cash flow to the firm (FCFF) and free cash flow to equity (FCFE).",
    ],
  },
  {
    name: "Capital Structure Analysis",
    prompts: [
      "Assess the company's capital structure over the past 5 years. Provide a breakdown of the company's sources of capital including equity, short-term debt, and long-term debt. Also, calculate and analyze key ratios such as debt-to-equity ratio, equity ratio, and weighted average cost of capital (WACC).",
    ],
  },
  {
    name: "Financial Health Assessment",
    prompts: [
      "Based on the financial statement analysis and capital structure analysis, assess the overall financial health of the company. Highlight any potential financial risks such as liquidity risk, solvency risk, and profitability risk. Also, provide a comparison of the company's financial performance and health with its peers and industry benchmarks.",
    ],
  },
  {
    name: "Management Team Evaluation",
    prompts: [
      "Evaluate the company's management team. Assess their experience, track record, and leadership skills. Also, consider their strategic vision for the company and their ability to execute on that vision.",
    ],
  },
  {
    name: "Customer and Market Analysis",
    prompts: [
      "Analyze the company's customer base and market. Identify the company's target market, understand its customer acquisition strategy, and assess the potential for growth. Also, consider the competitive landscape and the company's position within it.",
    ],
  },
  {
    name: "Product or Service Analysis",
    prompts: [
      "Evaluate the company's product or service. Consider its unique selling proposition, its value to customers, and its potential for growth. Also, assess the company's product development process and its ability to innovate.",
    ],
  },
  {
    name: "Risk Assessment",
    prompts: [
      "Identify and assess potential risks to the company. This could include operational risks, financial risks, market risks, regulatory risks, and strategic risks. Also, consider the company's risk management strategies and their effectiveness.",
    ],
  },
  {
    name: "Investment Merits and Concerns",
    prompts: [
      "Based on the above analyses, summarize the key investment merits and concerns. Consider the company's financial performance, its market and competitive position, its management team, and potential risks. Also, assess the potential return on investment and whether it aligns with the investment objectives.",
    ],
  },
];
