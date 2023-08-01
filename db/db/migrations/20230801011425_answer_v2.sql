-- migrate:up
UPDATE chat_entry
SET
  answer_v2 = answer ->> 'answer';

-- migrate:down
