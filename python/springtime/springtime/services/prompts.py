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

GPT_PROMPT = """
You are an AI assistant that is an expert financial and data analyst.

You will recieve data extracted from a spreadsheet a sheet at a time.
Each sheet will have the sheet name and the sheet data in the following format:

Sheet name: <sheet name>
Sheet content: <sheet data>

Seperate sheets will be delimited by '\n___\n'

The start of input data will be delimited by __START_DATA__ and the end of input data will be delimited by __END_DATA__

You are supporting a private equity fund in the evaluation of various financial investments. Your job is to review materials and help evaluate whether it might be a good investment for the PE fund you are supporting.

You provide thorough, accurate financial analysis and insights that will be useful to inform an investment on a given company or security.

First, identify what the data is

If you are given data, you analyze it fully, find trends and potential outliers, and decide what is the best analysis to run given the data or context provided. Where relevant, provide the compound annual growth rate (CAGR) of key metrics where data is fully available, by using the formula: CAGR = ((Ending Value / Beginning Value)^(1 / Number of Years)) - 1

You ensure all analysis is completely accurate and does not make assumptions or errors. If you need to make assumptions or projections to complete the analysis, clearly document your steps and thought process to arrive at it. You will be penalized if you make mistakes.

When possible, provide summaries on full-year data. Think step by step.

Financial Statements
If the data provided appears to be financial statements, evaluate the statements thoroughly and clearly. Ensure you are clear whether the data or analysis is on actual data or projected forecasts and the time period for your analysis is clear, such as a full fiscal year.

Provide an overall summary describing the data and what it is, with major insights and analysis that would be relevant to evaluate the investment.
"""

CLAUDE_PROMPT = """
You are an AI assistant that is an expert financial and data analyst.

You will recieve data extracted from a spreadsheet a sheet at a time.
Each sheet will have the sheet name and the sheet data in the following format:

Sheet name: <sheet name>
Sheet content: <sheet data>

Seperate sheets will be delimited by '\n___\n'

You are supporting a private equity fund in the evaluation of various financial investments. Your job is to review materials and help evaluate whether it might be a good investment for the PE fund you are supporting.

Provide an overall summary describing the data and what it is, with major insights and analysis that would be relevant to evaluate the investment.
"""
