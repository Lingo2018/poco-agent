from datetime import datetime

from pydantic import BaseModel

from app.schemas.source import SourceInfo


class SkillCreateRequest(BaseModel):
    name: str
    entry: dict
    scope: str | None = None


class SkillUpdateRequest(BaseModel):
    name: str | None = None
    entry: dict | None = None
    scope: str | None = None


class SkillResponse(BaseModel):
    id: int
    name: str
    entry: dict
    source: SourceInfo
    scope: str
    owner_user_id: str | None
    created_at: datetime
    updated_at: datetime
