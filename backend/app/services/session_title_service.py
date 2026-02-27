import logging
import unicodedata
import uuid

from anthropic import Anthropic

from app.core.database import SessionLocal
from app.core.settings import get_settings
from app.repositories.session_repository import SessionRepository

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are an assistant skilled in conversation. "
    "You need to summarize the user's conversation into a title within 10 words. "
    "The language of the title should be consistent with the user's primary language. "
    "Return only the title as plain text, without punctuation or special symbols, "
    "and without any prefixes, quotes, or extra lines."
)


class SessionTitleService:
    def __init__(self) -> None:
        settings = get_settings()
        api_key = (settings.anthropic_api_key or "").strip()
        self._enabled = bool(api_key)
        base_url = (settings.anthropic_base_url or "").strip() or (
            "https://api.anthropic.com"
        )
        base_url = base_url.rstrip("/")
        # The SDK expects a base URL without a trailing "/v1".
        if base_url.endswith("/v1"):
            base_url = base_url[: -len("/v1")]

        self._client: Anthropic | None = None
        self._model = settings.default_model
        if not self._enabled:
            logger.warning("ANTHROPIC_API_KEY is not set; title generation disabled")
        else:
            self._client = Anthropic(
                api_key=api_key,
                base_url=base_url,
                timeout=15.0,
                max_retries=2,
            )

    def generate_and_update(self, session_id: uuid.UUID, prompt: str) -> None:
        if not prompt or not prompt.strip():
            return

        title = self._generate_title(prompt)
        if not title:
            return

        db = SessionLocal()
        try:
            db_session = SessionRepository.get_by_id(db, session_id)
            if not db_session:
                logger.warning(
                    "Title generation skipped: session not found %s", session_id
                )
                return
            if db_session.title:
                return
            db_session.title = title
            db.commit()
            logger.info("Generated title for session %s", session_id)
        except Exception as exc:
            logger.exception("Failed to persist session title: %s", exc)
        finally:
            db.close()

    def _generate_title(self, prompt: str) -> str | None:
        if not self._enabled or self._client is None:
            return None

        try:
            message = self._client.messages.create(
                model=self._model,
                messages=[{"role": "user", "content": prompt}],
                system=SYSTEM_PROMPT,
                temperature=0.2,
                max_tokens=32,
            )
        except Exception as exc:
            logger.exception("Anthropic title generation failed: %s", exc)
            return None

        text_parts: list[str] = []
        for block in getattr(message, "content", []) or []:
            if isinstance(block, dict):
                block_type = block.get("type")
                text = block.get("text")
            else:
                block_type = getattr(block, "type", None)
                text = getattr(block, "text", None)

            if block_type != "text":
                continue
            if isinstance(text, str) and text:
                text_parts.append(text)

        content = "".join(text_parts).strip()
        cleaned = self._sanitize_title(content)
        if not cleaned:
            return None
        return cleaned

    def _sanitize_title(self, text: str) -> str:
        text = text.replace("\r", " ").replace("\n", " ").strip()
        text = text.replace('"', "").replace("'", "")

        cleaned_chars: list[str] = []
        for ch in text:
            if ch.isspace():
                cleaned_chars.append(" ")
                continue
            category = unicodedata.category(ch)
            if category.startswith("P") or category.startswith("S"):
                continue
            cleaned_chars.append(ch)

        cleaned = "".join(cleaned_chars)
        cleaned = " ".join(cleaned.split())

        if not cleaned:
            return ""

        words = cleaned.split(" ")
        if len(words) > 10:
            cleaned = " ".join(words[:10])
        return cleaned
