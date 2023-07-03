from springtime.llm.ml import ChatHistory

TOKEN_LIMIT = 4_000
ANALYST_PROMPT = "You are an expert financial analyst."
RESPOND_PROMPT = "Respond to the following prompt:"
CONTEXT_PROMPT = "Use the following context to supplement your information:"
DEFAULT_PROMPT_LEN = len(ANALYST_PROMPT) + len(RESPOND_PROMPT)


def create_prompt(context: str, question: str, history: list[ChatHistory]):

    question_len = len(question)
    history_prompt = create_prompt_for_history(history)
    history_len = len(history_prompt)
    total_len = DEFAULT_PROMPT_LEN + question_len + \
        history_len + len(context) + len(CONTEXT_PROMPT)

    if total_len >= TOKEN_LIMIT:
        context = context[:TOKEN_LIMIT - DEFAULT_PROMPT_LEN -
                          question_len - history_len -
                          len(CONTEXT_PROMPT) - 1]

    context_prompt = create_prompt_for_context(context)

    non_empty_prompts = [
        prompt for prompt in
        [
            ANALYST_PROMPT,
            history_prompt,
            context_prompt,
            RESPOND_PROMPT,
            question
        ]
        if len(prompt.strip()) > 0
    ]

    return '\n'.join(non_empty_prompts)


def create_prompt_for_context(context: str):
    if not context:
        return ''

    return f"{CONTEXT_PROMPT}{context}"


def create_prompt_for_history(history: list[ChatHistory]):
    if not history:
        return ''

    prompt = ''.join([
        "Previously, the user prompted you with the following questions/statements:\n",
        *[
            f"{h.question}\n" for h in history
        ]
    ])
    return ' ' + prompt
