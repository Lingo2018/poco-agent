import re

from sqlalchemy.orm import Session

from app.core.errors.error_codes import ErrorCode
from app.core.errors.exceptions import AppException
from app.models.sub_agent import SubAgent
from app.repositories.sub_agent_repository import SubAgentRepository
from app.schemas.sub_agent import (
    SubAgentCreateRequest,
    SubAgentDefinition,
    SubAgentMode,
    SubAgentResolveResponse,
    SubAgentResponse,
    SubAgentUpdateRequest,
)


_SUBAGENT_NAME_PATTERN = re.compile(r"^[A-Za-z0-9._-]+$")


def _validate_subagent_name(name: str) -> str:
    value = (name or "").strip()
    if not value or value in {".", ".."} or not _SUBAGENT_NAME_PATTERN.fullmatch(value):
        raise AppException(
            error_code=ErrorCode.BAD_REQUEST,
            message=f"Invalid subagent name: {name}",
        )
    return value


def _normalize_mode(mode: str | None) -> SubAgentMode:
    value = (mode or "").strip() or "structured"
    if value == "raw":
        return "raw"
    if value == "structured":
        return "structured"
    raise AppException(
        error_code=ErrorCode.BAD_REQUEST,
        message=f"Invalid subagent mode: {mode}",
    )


def _require_non_empty(value: str | None, *, field: str) -> str:
    text = (value or "").strip()
    if not text:
        raise AppException(
            error_code=ErrorCode.BAD_REQUEST,
            message=f"{field} cannot be empty",
        )
    return text


def _normalize_tools(value: list[str] | None) -> list[str] | None:
    if value is None:
        return None
    if not isinstance(value, list):
        return None
    result: list[str] = []
    seen: set[str] = set()
    for item in value:
        if not isinstance(item, str):
            continue
        tool = item.strip()
        if not tool:
            continue
        if tool in seen:
            continue
        seen.add(tool)
        result.append(tool)
        if len(result) >= 64:
            break
    return result or None


def _strip_bom(text: str) -> str:
    return text[1:] if text.startswith("\ufeff") else text


def _extract_raw_front_matter_name(raw_markdown: str) -> str | None:
    """Extract the `name:` field from YAML front matter.

    This is a minimal parser to validate that raw markdown subagents contain a
    stable name that matches the database record.
    """

    text = _strip_bom(raw_markdown or "")
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return None

    end_idx = None
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            end_idx = i
            break
    if end_idx is None:
        return None

    for line in lines[1:end_idx]:
        raw = line.strip()
        if not raw or raw.startswith("#"):
            continue
        if not raw.lower().startswith("name:"):
            continue
        value = raw.split(":", 1)[1].strip()
        if (
            value.startswith(('"', "'"))
            and value.endswith(('"', "'"))
            and len(value) >= 2
        ):
            value = value[1:-1].strip()
        return value or None
    return None


class SubAgentService:
    def list_subagents(self, db: Session, *, user_id: str) -> list[SubAgentResponse]:
        items = SubAgentRepository.list_by_user(db, user_id=user_id)
        return [self._to_response(a) for a in items]

    def get_subagent(
        self, db: Session, *, user_id: str, subagent_id: int
    ) -> SubAgentResponse:
        item = SubAgentRepository.get_by_id(db, subagent_id)
        if not item or item.user_id != user_id:
            raise AppException(
                error_code=ErrorCode.SUBAGENT_NOT_FOUND,
                message=f"Subagent not found: {subagent_id}",
            )
        return self._to_response(item)

    def create_subagent(
        self, db: Session, *, user_id: str, request: SubAgentCreateRequest
    ) -> SubAgentResponse:
        name = _validate_subagent_name(request.name)
        mode = _normalize_mode(request.mode)

        if SubAgentRepository.get_by_user_and_name(db, user_id=user_id, name=name):
            raise AppException(
                error_code=ErrorCode.SUBAGENT_ALREADY_EXISTS,
                message=f"Subagent already exists: {name}",
            )

        if mode == "structured":
            description = _require_non_empty(request.description, field="description")
            prompt = _require_non_empty(request.prompt, field="prompt")
            tools = _normalize_tools(request.tools)
            model = request.model
            raw_markdown = None
        else:
            raw_markdown = _require_non_empty(
                request.raw_markdown, field="raw_markdown"
            )
            extracted_name = _extract_raw_front_matter_name(raw_markdown)
            if not extracted_name:
                raise AppException(
                    error_code=ErrorCode.BAD_REQUEST,
                    message="raw_markdown must include YAML front matter with name",
                )
            if extracted_name.strip() != name:
                raise AppException(
                    error_code=ErrorCode.BAD_REQUEST,
                    message=f"raw_markdown name mismatch: {extracted_name} != {name}",
                )
            description = (request.description or "").strip() or None
            prompt = None
            tools = _normalize_tools(request.tools)
            model = request.model

        item = SubAgent(
            user_id=user_id,
            name=name,
            enabled=bool(request.enabled),
            mode=mode,
            description=description,
            prompt=prompt,
            tools=tools,
            model=model,
            raw_markdown=raw_markdown,
        )

        SubAgentRepository.create(db, item)
        db.commit()
        db.refresh(item)
        return self._to_response(item)

    def update_subagent(
        self,
        db: Session,
        *,
        user_id: str,
        subagent_id: int,
        request: SubAgentUpdateRequest,
    ) -> SubAgentResponse:
        item = SubAgentRepository.get_by_id(db, subagent_id)
        if not item or item.user_id != user_id:
            raise AppException(
                error_code=ErrorCode.SUBAGENT_NOT_FOUND,
                message=f"Subagent not found: {subagent_id}",
            )

        if (
            request.name is not None
            and request.name.strip()
            and request.name != item.name
        ):
            new_name = _validate_subagent_name(request.name)
            if SubAgentRepository.get_by_user_and_name(
                db, user_id=user_id, name=new_name
            ):
                raise AppException(
                    error_code=ErrorCode.SUBAGENT_ALREADY_EXISTS,
                    message=f"Subagent already exists: {new_name}",
                )
            item.name = new_name

        if request.enabled is not None:
            item.enabled = bool(request.enabled)

        if request.mode is not None:
            item.mode = _normalize_mode(request.mode)

        if request.description is not None:
            item.description = request.description.strip() or None
        if request.prompt is not None:
            item.prompt = request.prompt
        if request.tools is not None:
            item.tools = _normalize_tools(request.tools)
        if request.model is not None:
            item.model = request.model

        if request.raw_markdown is not None:
            item.raw_markdown = request.raw_markdown

        # Validate payload based on the final mode.
        if item.mode == "structured":
            if not (item.description or "").strip():
                raise AppException(
                    error_code=ErrorCode.BAD_REQUEST,
                    message="description cannot be empty",
                )
            if not (item.prompt or "").strip():
                raise AppException(
                    error_code=ErrorCode.BAD_REQUEST,
                    message="prompt cannot be empty",
                )
            item.raw_markdown = None
        else:
            if not (item.raw_markdown or "").strip():
                raise AppException(
                    error_code=ErrorCode.BAD_REQUEST,
                    message="raw_markdown cannot be empty",
                )
            extracted_name = _extract_raw_front_matter_name(item.raw_markdown or "")
            if not extracted_name:
                raise AppException(
                    error_code=ErrorCode.BAD_REQUEST,
                    message="raw_markdown must include YAML front matter with name",
                )
            if extracted_name.strip() != (item.name or "").strip():
                raise AppException(
                    error_code=ErrorCode.BAD_REQUEST,
                    message=f"raw_markdown name mismatch: {extracted_name} != {item.name}",
                )
            item.prompt = None

        db.commit()
        db.refresh(item)
        return self._to_response(item)

    def delete_subagent(self, db: Session, *, user_id: str, subagent_id: int) -> None:
        item = SubAgentRepository.get_by_id(db, subagent_id)
        if not item or item.user_id != user_id:
            raise AppException(
                error_code=ErrorCode.SUBAGENT_NOT_FOUND,
                message=f"Subagent not found: {subagent_id}",
            )
        SubAgentRepository.delete(db, item)
        db.commit()

    def resolve_for_execution(
        self,
        db: Session,
        *,
        user_id: str,
        subagent_ids: list[int] | None,
    ) -> SubAgentResolveResponse:
        if subagent_ids is None:
            items = SubAgentRepository.list_enabled_by_user(db, user_id=user_id)
        elif subagent_ids:
            items = SubAgentRepository.list_by_ids(
                db, user_id=user_id, subagent_ids=subagent_ids
            )
            by_id = {a.id: a for a in items}
            ordered: list[SubAgent] = []
            seen: set[int] = set()
            for sid in subagent_ids:
                if sid in seen:
                    continue
                seen.add(sid)
                item = by_id.get(sid)
                if item:
                    ordered.append(item)
            items = ordered
        else:
            items = []

        structured: dict[str, SubAgentDefinition] = {}
        raw: dict[str, str] = {}

        for entry in items:
            name = (entry.name or "").strip()
            if not name:
                continue
            mode: SubAgentMode = "structured" if entry.mode == "structured" else "raw"
            if mode == "structured":
                description = (entry.description or "").strip()
                prompt = (entry.prompt or "").strip()
                if not description or not prompt:
                    continue
                structured[name] = SubAgentDefinition(
                    description=description,
                    prompt=prompt,
                    tools=_normalize_tools(entry.tools),
                    model=entry.model
                    if entry.model in {"sonnet", "opus", "haiku", "inherit"}
                    else None,
                )
            else:
                markdown = entry.raw_markdown or ""
                if not markdown.strip():
                    continue
                raw[name] = markdown

        return SubAgentResolveResponse(structured_agents=structured, raw_agents=raw)

    @staticmethod
    def _to_response(item: SubAgent) -> SubAgentResponse:
        mode: SubAgentMode = "structured" if item.mode == "structured" else "raw"
        return SubAgentResponse(
            id=item.id,
            user_id=item.user_id,
            name=item.name,
            enabled=bool(item.enabled),
            mode=mode,
            description=item.description,
            prompt=item.prompt,
            tools=_normalize_tools(item.tools),
            model=item.model
            if item.model in {"sonnet", "opus", "haiku", "inherit"}
            else None,
            raw_markdown=item.raw_markdown,
            created_at=item.created_at,
            updated_at=item.updated_at,
        )
