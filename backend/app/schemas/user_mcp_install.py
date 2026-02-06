from datetime import datetime

from pydantic import BaseModel


class UserMcpInstallCreateRequest(BaseModel):
    server_id: int
    enabled: bool = True


class UserMcpInstallUpdateRequest(BaseModel):
    enabled: bool | None = None


class UserMcpInstallBulkUpdateRequest(BaseModel):
    enabled: bool
    install_ids: list[int] | None = None


class UserMcpInstallBulkUpdateResponse(BaseModel):
    updated_count: int


class UserMcpInstallResponse(BaseModel):
    id: int
    user_id: str
    server_id: int
    enabled: bool
    created_at: datetime
    updated_at: datetime
