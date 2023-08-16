def get_chunks(s: str, maxlength: int):
    start = 0
    end = 0
    while start + maxlength < len(s) and end != -1:
        end = s.rfind(" ", start, start + maxlength + 1)
        yield s[start:end]
        start = end + 1
    yield s[start:]


def first_chunk(s: str, maxlength: int):
    gen = get_chunks(s, maxlength)
    return next(gen)
