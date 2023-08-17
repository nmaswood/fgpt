import re

import bleach
import markdown
import pydantic
from loguru import logger

TAGS = set(bleach.ALLOWED_TAGS) | {
    "br",
    "caption",
    "code",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "li",
    "p",
    "table",
    "tbody",
    "td",
    "tfoot",
    "th",
    "thead",
    "tr",
    "ul",
}


def html_from_text(text: str) -> str | None:
    try:
        m = markdown.markdown(text, extensions=["tables"])
        return bleach.clean(m, tags=TAGS)
    except Exception as e:
        logger.error(f"Error generating markdown: {e}")
        return None


CITATION = re.compile("\\[citation\\|(.*?),(.*?)]")


class Citation(pydantic.BaseModel):
    index: int
    file_name: str
    start: int
    end: int | None
    pages: str
    has_multiple_pages: bool


def parse_citations(text: str, prefix_id: str) -> str:
    occurence = [0]

    citations: list[Citation] = []
    citation_map: dict[tuple, Citation] = {}

    def replacer(match: re.Match[str]):
        file_name = match.group(1)
        pages = [int(value) for value in match.group(2).split("-")]
        first_page = pages[0] if len(pages) > 0 else None
        second_page = pages[1] if len(pages) > 1 else None

        key = (file_name, first_page, second_page)
        citation = citation_map.get(key)
        if not citation:
            occurence[0] += 1
            citation = Citation(
                pages=match.group(2),
                index=occurence[0],
                file_name=file_name,
                start=pages[0],
                end=pages[1] if len(pages) > 1 else None,
                has_multiple_pages=len(pages) > 1,
            )
            citation_map[key] = citation
            citations.append(citation)

        return f'<a class="fgpt-citation" href="#citation-{prefix_id}-{citation.index}">[{citation.index}]</a>'

    acc = [CITATION.sub(replacer, text)]

    for citation in citations:
        acc.append(
            f'<p class="fgpt-citation-text" id="citation-{prefix_id}-{citation.index}"><span class="fgpt-citation-footnote-marker">[{citation.index}]</span> <span class="fgpt-citation-file-name">{citation.file_name}</span> | <span class="fgpt-citation-pages">{citation.pages}</span></p>',
        )

    return "".join(acc)
