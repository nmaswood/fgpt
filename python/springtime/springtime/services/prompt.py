import re

from springtime.models.chat import (
    ChatChunkContext,
    ChatFileContext,
    ChatHistory,
    RangeLocation,
    SingleLocation,
)

CONTEXT_PROMPT = (
    "Potentially relevant information to the user's question is provided in chunks from files below.\n"
    "Use the information to supplement your knowledge.\n"
    "If you do not know the answer. Reply: I do not know.\n"
    """
* When referencing information from a source
use end footnote citations containing the file name and page number of the source in the following style [citation: file name, page number]. Output the citation as a seperate markdown paragraph at the end of your response.


 """
)


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
            context_prompt,
            history_prompt,
            f"Human: {question}",
            "AI:",
        ]
        if len(prompt.strip()) > 0
    ]

    return "\n".join(non_empty_prompts)


def create_prompt_for_context(context: list[ChatFileContext]):
    if not context:
        return ""

    prompts = "\n\n".join(
        [create_prompt_for_file_context(file) for file in context],
    )

    return f"{CONTEXT_PROMPT}\n---\n{prompts}\n---\n"


def create_prompt_for_file_context(context: ChatFileContext):
    for_chunks = "\n".join(
        [create_prompt_for_file_chunk(chunk) for chunk in context.chunks],
    )
    return f"""
file name: {context.file_name}{for_chunks}

""".strip()


def create_prompt_for_file_chunk(chunk: ChatChunkContext):
    stripped = re.sub(r"\n+", "\n", chunk.content).strip()
    # TODO  order: {chunk.order}
    return f"""{format_chunk_location(chunk.location)}content: {stripped}
"""


def format_chunk_location(location: SingleLocation | RangeLocation | None):
    match location:
        case SingleLocation(page=page):
            return f"\npage: {page + 1}\n"
        case RangeLocation(start=start, end=end):
            return f"\npages: {start + 1} to {end + 1}\n"
        case None:
            return ""


def create_prompt_for_histories(history: list[ChatHistory]):
    if not history:
        return ""

    total_len = len(history)
    prompt = "\n".join(
        [
            "This is transcript of your conversation with the user so far. Please respond to the remaining question:\n",
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
Human: {history.question}
AI: {history.answer if not too_long else "..."}
"""
