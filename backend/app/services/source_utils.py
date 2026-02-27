from pathlib import PurePosixPath
from typing import Any


def infer_capability_source(
    *,
    scope: str,
    source: object,
    entry: object,
) -> dict[str, Any]:
    """Infer a displayable source object for skills/plugins.

    Prefer the explicit `source` column; fall back to legacy entry.source when missing.
    """
    if isinstance(source, dict) and isinstance(source.get("kind"), str):
        return source

    if scope == "system":
        return {"kind": "system"}

    if isinstance(entry, dict):
        raw = entry.get("source") if isinstance(entry.get("source"), dict) else None
        archive_key = raw.get("archive_key") if isinstance(raw, dict) else None
        if isinstance(archive_key, str) and archive_key.strip():
            filename = PurePosixPath(archive_key).name
            if filename == "github.zip":
                return {"kind": "github"}
            if filename.lower().endswith(".zip"):
                return {"kind": "zip", "filename": filename}

    return {"kind": "unknown"}
