import re

from springtime.models.chat import ChatChunkContext, ChatFileContext, ChatHistory

TOKEN_LIMIT = 12_000
RESPOND_PROMPT = "Respond to the following prompt:"
CONTEXT_PROMPT = (
    "Potentially relevant information is provided in chunks from files below."
    "Use the information to supplement your knowledge."
    "If you do not know the answer. Reply:  I do not know."
)
DEFAULT_PROMPT_LEN = len(RESPOND_PROMPT)


def create_prompt(
    context: list[ChatFileContext],
    question: str,
    history: list[ChatHistory],
):
    history_prompt = create_prompt_for_histories(history)
    context_prompt = create_prompt_for_context(context)

    non_empty_prompts = [
        prompt
        for prompt in [
            history_prompt,
            context_prompt,
            f"\n\n{RESPOND_PROMPT}",
            question,
        ]
        if len(prompt.strip()) > 0
    ]

    return "\n".join(non_empty_prompts)


def create_prompt_for_context(context: list[ChatFileContext]):
    if not context:
        return ""

    prompts = "\n".join(
        [create_prompt_for_file_context(file) for file in context],
    )

    return f"{CONTEXT_PROMPT}\n{prompts}"


def create_prompt_for_file_context(context: ChatFileContext):
    for_chunks = "\n".join(
        [create_prompt_for_file_chunk(chunk) for chunk in context.chunks],
    )
    return f"""
file name: {context.file_name}

{for_chunks}
""".strip()


def create_prompt_for_file_chunk(chunk: ChatChunkContext):
    stripped = re.sub(r"\n+", "\n", chunk.content).strip()
    return f"""
order: {chunk.order}
content: {stripped}
"""


def create_prompt_for_histories(history: list[ChatHistory]):
    if not history:
        return ""

    total_len = len(history)
    prompt = "\n".join(
        [
            "Previously, the user prompted you with the following questions/statements:\n",
            *[
                create_prompt_for_history(h, total_len, idx)
                for idx, h in enumerate(history)
            ],
        ],
    )
    return " " + prompt


WINDOW_LIMIT = 3


def create_prompt_for_history(
    history: ChatHistory,
    total_len: int,
    idx: int,
):
    too_long = total_len - idx > WINDOW_LIMIT
    return f"""
User: {history.question}
You: {history.answer if not too_long else "OMITTED FOR BREVITY"}
"""
