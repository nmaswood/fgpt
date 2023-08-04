-- migrate:up
CREATE TABLE
  IF NOT EXISTS prompt_invocation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    organization_id UUID REFERENCES organization (id),
    prompt_id UUID REFERENCES prompt (id),
    input_tokens integer CHECK (input_tokens >= 0),
    model text NOT NULL CHECK (
      char_length(model) > 0
      and char_length(model) <= 255
    ),
    output_tokens integer CHECK (input_tokens >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
    updated_at TIMESTAMPTZ DEFAULT NOW () NOT NULL
  );

-- migrate:down
DROP TABLE IF EXISTS prompt_invocation;
