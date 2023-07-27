import bleach
import markdown
from loguru import logger

TAGS = set(bleach.ALLOWED_TAGS) | {
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "ul",
    "li",
    "table",
    "tr",
    "td",
    "th",
    "thead",
    "tbody",
    "tfoot",
    "caption",
    "code",
}


def html_from_text(text: str) -> str | None:
    try:
        m = markdown.markdown(text, extensions=["tables"])
        return bleach.clean(m, tags=TAGS)
    except Exception as e:
        logger.error(f"Error generating markdown: {e}")
        return None
