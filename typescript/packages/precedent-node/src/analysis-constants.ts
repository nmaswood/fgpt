import { AnalysisItem } from "@fgpt/precedent-iso";

export const STANDARD_ANALYSIS: AnalysisItem[] = [
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

  {
    name: "Income Statement / P&L Analysis",
    prompts: [
      "What are the company's main revenue streams and how have they evolved over time?",
      "How does the company recognize revenue? Are there any potential risks or irregularities in its revenue recognition policy?",
      "Break down revenue by product, geography, or customer segment to understand where the company's revenue is coming from and which areas are driving growth.",
      "What are the company's main cost items and how have they evolved over time?",
      "Are there any opportunities for cost reduction or efficiency improvements?",
      "Calculate cost as a percentage of revenue for each major cost item to understand its impact on profitability. Look for trends or anomalies.",
      "How has the company's gross margin, operating margin, and net margin evolved over time?",
      "How does the company's profitability compare with industry peers?",
      "Calculate and track key profitability ratios over time. Compare these ratios with industry benchmarks.",
    ],
  },
  {
    name: "Balance Sheet Analysis",
    prompts: [
      "What are the company's main assets and how efficiently are they being used?",
      "Does the company have sufficient liquidity to meet its short-term obligations?",
      "Calculate asset turnover ratios to assess the efficiency of asset usage. Calculate liquidity ratios such as the current ratio and quick ratio to assess short-term financial health.",
      "What are the company's main liabilities and how are they structured?",
      "Does the company have a sustainable debt level?",
      "Calculate leverage ratios such as the debt-to-equity ratio and debt-to-EBITDA ratio to assess the company's debt level and its ability to service its debt.",
    ],
  },
  {
    name: "Cash Flow Statement Analysis",
    prompts: [
      "How does the company's cash flow from operations compare with its net income?",
      "Does the company generate sufficient cash flow to fund its investment needs and return capital to shareholders?",
      "Compare cash flow from operations with net income to assess the quality of earnings. Calculate free cash flow to assess the company's financial flexibility.",
    ],
  },
  {
    name: "Investment and Financing Analysis",
    prompts: [
      "How much is the company investing in capital expenditures and acquisitions?",
      "How is the company financing its operations and investments - through debt, equity, or internal cash generation?",
      "Track the company's capital expenditure and acquisition activity. Analyze the sources and uses of cash to understand the company's financing strategy.",
    ],
  },
  {
    name: "Valuation Analysis using Comparable Multiples",
    prompts: ["Spreading comps", "Comps model and tutorial"],
  },
  {
    name: "Financial Due Diligence",
    prompts: [
      "Financial Statements Analysis: Review the company's income statement, balance sheet, and cash flow statement for the past 3-5 years. Look for trends in revenue, profitability, cash flow, and financial health.",
      "Is the company's revenue growing, stable, or declining?",
      "What are the company's main cost drivers and are they under control?",
      "How profitable is the company and is its profitability improving or declining?",
      "Does the company generate positive cash flow from its operations?",
      "Does the company have a healthy balance sheet with a reasonable level of debt?",
      "Financial Projections: Review the company's financial projections for the next 3-5 years. Assess the assumptions behind these projections and their reasonableness.",
      "What are the company's revenue and profitability projections?",
      "What assumptions are these projections based on and are they reasonable?",
      "How sensitive are these projections to changes in key assumptions?",
      "Capital Structure: Understand the company's current capital structure and any potential changes post-investment.",
      "What is the company's current capital structure?",
      "How will the proposed investment change the capital structure?",
      "What will be the impact on existing shareholders?",
    ],
  },
  {
    name: "Operational Due Diligence",
    prompts: [
      "Business Model: Understand the company's business model and how it generates revenue.",
      "What are the company's key products or services?",
      "Who are the company's key customers and how does it acquire them?",
      "What is the company's pricing model and how does it compare with competitors?",
      "Operations: Review the company's operational processes, supply chain, and human resources.",
      "How efficient are the company's operational processes?",
      "How reliable is the company's supply chain and are there any potential risks?",
      "Does the company have a skilled and motivated workforce?",
      "Market and Competition: Understand the market the company operates in and its competitive position.",
      "What is the size and growth rate of the market the company operates in?",
      "Who are the company's main competitors and what is its competitive position?",
      "What are the company's key competitive advantages and how sustainable are they?",
      "Management Team: Assess the quality of the company's management team.",
      "Does the management team have the necessary skills and experience to execute the company's strategy?",
      "Is the management team committed to the company's success?",
    ],
  },
  {
    name: "Key skillsets of the job",
    prompts: [
      "Financial Statement Analysis: Financial statement analysis involves a detailed review of a company's financial statements - the income statement, balance sheet, and cash flow statement.",
      "The income statement provides information about a company's revenues, costs, and expenses, leading to its net income. It helps in understanding the company's profitability.",
      "The balance sheet provides a snapshot of a company's assets, liabilities, and shareholders' equity at a specific point in time. It helps in assessing the company's financial health and stability.",
      "The cash flow statement shows how changes in balance sheet accounts and income affect cash and cash equivalents, and breaks the analysis down to operating, investing, and financing activities. It helps in understanding the company's liquidity and cash flow management.",
      "Ratios derived from these statements, such as profitability ratios, liquidity ratios, leverage ratios, and efficiency ratios, are used to compare a company's performance with its peers and assess its financial health.",
      "Due Diligence: Due diligence is a comprehensive evaluation of a business from all aspects before making a buying decision. It involves a thorough investigation into a company's financials, operations, legal compliance, and more.",
      "Financial due diligence involves a detailed analysis of the company's financial statements, financial projections, capital structure, and other financial aspects.",
      "Operational due diligence involves reviewing the company's operational aspects, including its business model, operational processes, supply chain, and human resources.",
      "Legal due diligence involves reviewing legal aspects such as contracts, litigation, intellectual property, and regulatory compliance.",
      "Portfolio Management: Portfolio management involves managing an investment portfolio to achieve specific investment objectives. It includes:",
      "Asset Allocation: This involves deciding the proportion of funds to be invested in different asset classes such as equities, bonds, real estate, etc., based on the investor's risk tolerance, investment horizon, and financial goals.",
      "Diversification: This involves spreading investments across various assets or asset classes to reduce risk.",
      "Performance Measurement: This involves tracking the performance of the portfolio and comparing it with relevant benchmarks. It helps in assessing the effectiveness of the investment strategy.",
      "Risk Management: This involves identifying and managing potential risks in the portfolio. It includes market risk, credit risk, and liquidity risk.",
      "Negotiation Skills: In the context of private equity, negotiation skills are crucial in deal-making. Key aspects include:",
      "Price Negotiation: This involves negotiating the purchase price of the company or asset. It is influenced by factors such as the company's financial performance, market conditions, and the bargaining power of the buyer and seller.",
      "Deal Structure: This involves negotiating the structure of the deal, including the mix of debt and equity, the payment schedule, and other key terms.",
      "Legal Terms: This involves negotiating the legal terms of the deal, including representations and warranties, indemnities, and conditions precedent to closing.",
      "Regulatory Compliance: Private equity firms operate in a highly regulated environment and must comply with various laws and regulations. This includes:",
      "Securities Laws: These laws regulate how companies can raise capital, how securities are traded, and require disclosure of financial and other information.",
      "Tax Laws: These laws impact the structuring of private equity deals and the distribution of profits to investors.",
      "Corporate Governance Norms: These norms dictate how the company should be managed post-acquisition, including the composition of the board of directors, shareholder rights, and disclosure requirements.",
      "Non-compliance can result in penalties, damage to reputation, and can even jeopardize the success of a deal. Therefore, understanding and adhering to relevant regulations is a critical skill in private equity.",
    ],
  },
];
