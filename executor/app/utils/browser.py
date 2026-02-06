import re


_VIEWPORT_RE = re.compile(r"^\s*(\d{2,5})\s*[xX]\s*(\d{2,5})\s*$")


def parse_viewport_size(value: str) -> tuple[int, int] | None:
    """Parse viewport size formatted as WIDTHxHEIGHT (e.g. 1366x768)."""

    raw = (value or "").strip()
    if not raw:
        return None

    m = _VIEWPORT_RE.match(raw)
    if not m:
        return None

    try:
        width = int(m.group(1))
        height = int(m.group(2))
    except Exception:
        return None

    # Keep bounds reasonable to avoid OOM / absurd screenshots.
    if width < 200 or height < 200:
        return None
    if width > 8000 or height > 8000:
        return None

    return width, height


def format_viewport_size(width: int, height: int) -> str:
    return f"{int(width)}x{int(height)}"
