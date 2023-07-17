from springtime.services.sheet_processor import PreprocessedSheet


def format_sheet(sheet: PreprocessedSheet) -> str:
    return f"""
Sheet name: {sheet.sheet_name}
Sheet content: {sheet.stringified_sheet.content}
""".strip()
