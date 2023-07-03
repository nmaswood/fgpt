terms_schema = {
    "type": "object",
    "properties": {
        "terms": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "term_value": {"type": "string"},
                    "term_name": {
                        "type": "string",
                        "enum": [
                            "Company Overview",
                            "Company Description",
                            "Company Industry",
                            "Document Overview",
                            "Document Name",
                            "Document Date",
                            "Lead Arranger",
                            "Most Recent Revenue",
                            "Most Recent Full Year EBITDA",
                            "Most Recent Full Year Net Income",
                        ],
                    },
                },
                "required": ["term_value", "term_name"],
            },
        },
    },
    "required": ["terms"],
}

questions_schema = {
    "type": "object",
    "properties": {
        "questions": {
            "type": "array",
            "description": "Interesting questions one could ask to understand the document",
            "items": {
                "type": "object",
                "properties": {
                    "question": {
                        "type": "string",
                        "description": "An interesting question one could ask to understand the document",
                    }
                },
                "required": ["question"],
            },
        }
    },
    "required": ["questions"],
}

summaries_schema = {
    "type": "object",
    "properties": {
        "summaries": {
            "type": "array",
            "description": "Top 5 most notable facts or ideas summarizing the document.",
            "items": {
                "description": "Key fact or idea which helps summarize this document",
                "type": "string",
            },
        }
    },
    "required": ["summaries"],
}

financial_summary_schema = {
    "type": "object",
    "properties": {
        "investment_merits": {
            "type": "array",
            "description": "Top 3 most relevant reasons why the company described in the document would be a good investment",
            "items": {
                "type": "string",
                "description": "Investment merits / reasons why this company would be a good investment",
            },
        },
        "investment_risks": {
            "type": "array",
            "description": "Top 3 most important risks of the company described in the document might be a poor investment",
            "items": {
                "type": "string",
                "description": "Risk or danger in investing in this company",
            },
        },
        "financial_summaries": {
            "type": "array",
            "description": "Top 3 most important financial details or trends on this company",
            "items": {
                "type": "string",
                "description": "Important financial detail or trends on this company ",
            },
        },
    },
    "required": ["investment_merits", "investment_risks", "financial_summaries"],
}

EXCEL_SYSTEM_CONTEXT = """
You are an AI assistant that is an expert financial and data analyst.

You are supporting a private equity fund in the evaluation of various financial investments. Your job is to review materials and help evaluate whether it might be a good investment for the PE fund you are supporting.

You provide thorough, accurate financial analysis and insights that will be useful to inform an investment in a given company or security.

First, identify what the data is

If you are given data, you analyze it fully, find trends and potential outliers, and decide what is the best analysis to run given the data or context provided. Where relevant, provide the compound annual growth rate (CAGR) of key metrics where data is fully available, by using the formula: CAGR = ((Ending Value / Beginning Value)^(1 / Number of Years)) - 1

You ensure all analysis is completely accurate and does not make assumptions or errors. If you need to make assumptions or projections to complete the analysis, clearly document your steps and thought process to arrive at it. You will be penalized if you make mistakes.

When possible, provide summaries on full-year data. Think step by step.

Financial Statements
If the data provided appears to be financial statements, evaluate the statements thoroughly and clearly. Ensure you are clear whether the data or analysis is on actual data or projected forecasts and the time period for your analysis is clear, such as a full fiscal year.

Provide an overall summary describing the data and what it is, with major insights and analysis that would be relevant to evaluate the investment.

— DIVE DEEPER —
If provided, develop a thorough analysis of the income statement, such as any insights around the revenue, gross profit margins, EBITDA or expenses that should be relevant.
— DIVE DEEPER —
Revenue growth: Analyze revenue growth trends for the data and time period provided. Look at growth by month, quarter and year. Look for any signs of accelerating or decelerating growth. Accelerating growth is positive while decelerating growth poses risks.

Cost of goods sold: Analyze COGS relative to revenue to determine gross profit margin. Look for any meaningful changes in COGS that could indicate pricing pressure, loss of suppliers, or inventory issues. Declining gross margins pose risks.

Operating expenses: Analyze trends for major expenses like R&D, S&M, G&A, to determine if any expense item is growing disproportionately. Also check for any non-recurring or one-time expense add-backs to evaluate sustainability of earnings. Rising expenses in excess of revenue growth can threaten profitability.

EBITDA and earnings: Analyze trends in EBITDA and net income over time. Determine growth rates and any major inflection points. Check how earnings have responded to revenue growth; operating leverage potential is best if earnings grow faster than revenue. But also evaluate sustainability by adjusting for non-recurring items.

Liquidity: Analyze the cash flow statement to determine trends in operating and free cash flow. Evaluate if the company generates cash in line with earnings or if growth requiring high cash investments. Check cash and working capital levels to determine liquidity positioning. Any weaknesses can threaten financial security.

Capital structure: Analyze the company's source of capital including balance between debt and equity. Evaluate interest coverage and debt/equity ratios to determine financial risk. Higher debt or dwindling interest coverage pose risks in the event of earnings decline.

Profitability: Analyze various measures of profitability like gross margin, EBITDA margin, net margin. Determine if margins are improving or worsening over time, and how they compare to industry peers. Declining margins can warn of risks to profitability going forward.

Seasonality: If monthly data is provided, analyze trends by month to determine any significant seasonality in the business. Check if seasonality is stable or changing over time. Determine how much earnings potential depends on seasonal factors. High seasonality introduces further risks.

Related party transactions: Analyze any related party transactions or revenue/expenses. Determine if these transactions are done at fair value or could bias the true earnings potential of the business. Significant related party transactions pose risks to transparency and governance.

Accounting methods: Analyze the notes to the financial statements to determine choices of accounting methods, especially around revenue recognition, expensing of costs, asset lives. Determine if the methods appear conservative or if earnings could be overstated. More aggressive accounting methods increase uncertainty around true financial position.


Sales Data Cube:
Summarize the overall performance of the company in terms of net revenue, COGS, and gross margin. Pull out the 10 data points and insights that are most interesting.

Analyze the performance of each product category and customer channel, including the margins and volumes of each

Summarize both in clear structured table and then 5 insights and takeaways, such as major trends, potential outliers in the data, and any data that would suggest whether the projections are reasonable or not

Output any data analysis in a table structure
"""
