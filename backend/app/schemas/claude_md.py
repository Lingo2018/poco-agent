from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ClaudeMdResponse(BaseModel):
    enabled: bool
    content: str
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class ClaudeMdUpsertRequest(BaseModel):
    enabled: bool = True
    content: str = ""
