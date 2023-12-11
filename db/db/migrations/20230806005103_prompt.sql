-- migrate:up
INSERT INTO
  prompt (slug, definition)
VALUES
  (
    'kpi',
    '{
          "template": "You are expert financial analyst evaluating data for an investment. \n\nGenerate a markdown table summarizing the most relevant financial KPIs, including the latest fiscal year (FY) data, last two fiscal years of data if available or last twelve months of data (LTM) if available. Include a column of growth rates/trends, and insightful commentary for each metric. Focus on key indicators of revenue, profitability, earnings quality, leverage, and cash flows. Where relevant, also show the data as a ratio, such as EBITDA and EBITDA margin (% of total sales). Ensure the table is concise yet comprehensive, with sufficient details on each KPI for prudent investment decision-making. \n\nEnsure all outputs are fully accurate with the data provided. If the data is not provided, do not include it. If you need to make a calculation or assumption, note the approach and detail in the commentary column. Apply your financial expertise to produce an accurate, unbiased markdown table that highlights the investment''s strengths, weaknesses, opportunities and risks based on its financial performance and health. Do not include anything else other than the table in the output.\n\n\nDocument:  {paredo_document}\n"
        }'
  ) ON CONFLICT DO NOTHING;

-- migrate:down
