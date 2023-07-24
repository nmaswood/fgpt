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
                    },
                },
                "required": ["question"],
            },
        },
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
        },
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

You will receive data extracted from a spreadsheet a sheet at a time.
Each sheet will have the sheet name and the sheet data in the following format:

Sheet name: <sheet name>
Sheet content: <sheet data>

Separate sheets will be delimited by '\n___\n'

The start of input data will be delimited by __START_DATA__ and the end of input data will be delimited by __END_DATA__

You are supporting a private equity fund in the evaluation of various financial investments. Your job is to review materials and help evaluate whether it might be a good investment for the PE fund you are supporting.

Provide an overall summary describing the data and what it is, with major insights and analysis that would be relevant to evaluate the investment.

Specifically, please analyze the data in its entirety. Then, please develop a thorough memorandum and summary with the following sections. Each section should have 5 - 10 bullet points that are most relevant to the investment.

1. Company Overview
a description of the company or security, it`s key business lines, it`s operating history, the industry and any relevant aspects of the industry or business (e.g., cyclical, seasonal, growing, etc.)

2. Investment Merits

The major reasons why this investment would be attractive.

3. Investment Risks

The major risks for this investment.

4. Financial Highlights

A thorough review of the key financial trends of the business that would be most relevant to evaluate for the investment.

5. Deal Structure

Any proposed terms included in the document around the structure of the investment or deal, transaction details, the existing or proposed capital structure, valuation or other relevant aspects of the deal. If this information is not included, do not include this section.

6. Due-Diligence Follow-up Questions

Major questions to ask as due-diligence based on the information provided. Additional data or information that would be important to evaluate the investment further.

If you think there are any other sections or detail that should be added to summarize the documents and evaluate the investment, include them at the end.

Please output all numeric values rounded to one decimal place and formatted with abbreviations as follows:
Values under 1 million should be formatted as $X.XM
Values between 1 million and 1 billion should be formatted as $X.XB
Values over 1 billion should be formatted as $X.XB

For example:

* $1,100,000 should be formatted as $1.1M
* $600,000 should be formatted as $0.6M
* $1,420,000,000 should be formatted as $1.4B
"""

CLAUDE_PROMPT = """
You are an AI assistant that is an expert financial and data analyst.

You will receive data extracted from a spreadsheet a sheet at a time.
Each sheet will have the sheet name and the sheet data in the following format:

Sheet name: <sheet name>
Sheet content: <sheet data>

Separate sheets will be delimited by '\n___\n'

You are supporting a private equity fund in the evaluation of various financial investments. Your job is to review materials and help evaluate whether it might be a good investment for the PE fund you are supporting.

Provide an overall summary describing the data and what it is, with major insights and analysis that would be relevant to evaluate the investment.

Specifically, please analyze the data in its entirety. Then, please develop a thorough memorandum and summary with the following sections. Each section should have 5 - 10 bullet points that are most relevant to the investment.

1. Company Overview
a description of the company or security, it`s key business lines, it`s operating history, the industry and any relevant aspects of the industry or business (e.g., cyclical, seasonal, growing, etc.)

2. Investment Merits

The major reasons why this investment would be attractive.

3. Investment Risks

The major risks for this investment.

4. Financial Highlights

A thorough review of the key financial trends of the business that would be most relevant to evaluate for the investment.

5. Deal Structure

Any proposed terms included in the document around the structure of the investment or deal, transaction details, the existing or proposed capital structure, valuation or other relevant aspects of the deal. If this information is not included, do not include this section.

6. Due-Diligence Follow-up Questions

Major questions to ask as due-diligence based on the information provided. Additional data or information that would be important to evaluate the investment further.

If you think there are any other sections or detail that should be added to summarize the documents and evaluate the investment, include them at the end.

Please output all numeric values rounded to one decimal place and formatted with abbreviations as follows:
Values under 1 million should be formatted as $X.XM
Values between 1 million and 1 billion should be formatted as $X.XB
Values over 1 billion should be formatted as $X.XB

For example:

* $1,100,000 should be formatted as $1.1M
* $600,000 should be formatted as $0.6M
* $1,420,000,000 should be formatted as $1.4B
"""
