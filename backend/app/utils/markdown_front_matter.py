import re


_FRONT_MATTER_DELIM = "---"
_MODEL_KEY_PATTERN = re.compile(r"^\s*model\s*:", re.IGNORECASE)


def remove_model_from_yaml_front_matter(markdown: str) -> str:
    """Remove `model` from YAML front matter in a Markdown document.

    This is a minimal sanitizer used to ensure user content cannot override the
    executor's DEFAULT_MODEL via front matter configuration.
    """
    if not markdown:
        return ""

    text = markdown[1:] if markdown.startswith("\ufeff") else markdown
    lines = text.splitlines()
    if not lines or lines[0].strip() != _FRONT_MATTER_DELIM:
        return markdown

    end_idx: int | None = None
    for i in range(1, len(lines)):
        if lines[i].strip() == _FRONT_MATTER_DELIM:
            end_idx = i
            break
    if end_idx is None:
        return markdown

    front = lines[1:end_idx]
    body = lines[end_idx + 1 :]

    filtered_front: list[str] = []
    i = 0
    while i < len(front):
        line = front[i]
        if not _MODEL_KEY_PATTERN.match(line):
            filtered_front.append(line)
            i += 1
            continue

        # Drop `model` key. If it's a block value (e.g. `model:` / `model: |`), also
        # drop its indented continuation lines to avoid leaving invalid YAML behind.
        indent = len(line) - len(line.lstrip())
        remainder = line.split(":", 1)[1].strip() if ":" in line else ""
        is_block = remainder == "" or remainder.startswith(("|", ">"))
        i += 1
        if not is_block:
            continue
        while i < len(front):
            next_line = front[i]
            if not next_line.strip():
                i += 1
                continue
            next_indent = len(next_line) - len(next_line.lstrip())
            if next_indent <= indent:
                break
            i += 1

    rebuilt = [_FRONT_MATTER_DELIM, *filtered_front, _FRONT_MATTER_DELIM, *body]
    return "\n".join(rebuilt).rstrip() + "\n"
