-- migrate:up
CREATE TABLE
  IF NOT EXISTS transcript_href (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    href text UNIQUE NOT NULL,
    year text,
    quarter text,
    ticker text,
    allTickers jsonb default '[]'::jsonb
  );

CREATE INDEX IF NOT EXISTS "transcript_href_ticker" ON "transcript_href" ("ticker");

CREATE TABLE
  IF NOT EXISTS transcript_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    transcript_id UUID REFERENCES "transcript_href" (id),
    content jsonb
  );

CREATE INDEX IF NOT EXISTS "transcript_href_ticker" ON "transcript_href" ("ticker");

CREATE INDEX IF NOT EXISTS "transcript_content_transcript_id" ON "transcript_content" ("transcript_id");

-- migrate:down
DROP TABLE IF EXISTS transcript_href
DROP TABLE IF EXISTS transcript_content
