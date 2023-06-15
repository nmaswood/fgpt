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
                            "enum":
                            [
                                "Company Overview",
                                "Company Description",
                                "Company Industry",
                                "Document Overview",
                                "Document Name",
                                "Document Date",
                                "Lead Arranger",
                                "Most Recent Revenue",
                                "Most Recent Full Year EBITDA",
                                "Most Recent Full Year Net Income"
                            ]
                        },
                    },
                    "required": ["term_value", "term_name"]
                }
            },
    },
    "required": ["terms"]
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
                            "description": "An interesting question one could ask to understand the document"
                        }
                    },
                    "required": ["question"]
                }
            }
    },
    "required": ["questions"]
}

summaries_schema = {
    "type": "object",
    "properties": {
        "summaries": {
            "type": "array",
            "description": "Top 5 most notable facts or ideas summarizing the document.",
            "items": {
                "description": "Key fact or idea which helps summarize this document",
                "type": "string"
            }
        }
    },
    "required": [
        "summaries"
    ]
}

financial_summary_schema = {
    "type": "object",
    "properties": {
        "investment_merits": {
            "type": "array",
            "description": "Top 3 most relevant reasons why the company described in the document would be a good investment",
            "items": {
                "type": "string",
                "description": "Investment merits / reasons why this company would be a good investment"
            }
        },
        "investment_risks": {
            "type": "array",
            "description": "Top 3 most important risks of the company described in the document might be a poor investment",
            "items": {
                "type": "string",
                "description": "Risk or danger in investing in this company"
            }
        },
        "financial_summaries": {
            "type": "array",
            "description": "Top 3 most important financial details or trends on this company",
            "items": {
                "type": "string",
                "description": "Important financial detail or trends on this company "
            }
        }
    },
    "required": [
        "investment_merits",
        "investment_risks",
        "financial_summaries"
    ]
}
