import bleach
import markdown
from loguru import logger

TAGS = set(bleach.ALLOWED_ATTRIBUTES) | {
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "ul",
    "li",
}


def html_from_text(text: str) -> str | None:
    try:
        m = markdown.markdown(text)
        return bleach.clean(m, tags=TAGS)
    except Exception as e:
        logger.error(f"Error generating markdown: {e}")
        return None