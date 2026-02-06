from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.deps import get_current_user_id, get_db
from app.schemas.claude_md import ClaudeMdResponse, ClaudeMdUpsertRequest
from app.schemas.response import Response, ResponseSchema
from app.services.claude_md_service import ClaudeMdService

router = APIRouter(prefix="/claude-md", tags=["claude-md"])

service = ClaudeMdService()


@router.get("", response_model=ResponseSchema[ClaudeMdResponse])
async def get_claude_md(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> JSONResponse:
    result = service.get_settings(db, user_id=user_id)
    return Response.success(data=result, message="CLAUDE.md retrieved")


@router.put("", response_model=ResponseSchema[ClaudeMdResponse])
async def upsert_claude_md(
    request: ClaudeMdUpsertRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> JSONResponse:
    result = service.upsert_settings(db, user_id=user_id, request=request)
    return Response.success(data=result, message="CLAUDE.md updated")


@router.delete("", response_model=ResponseSchema[dict])
async def delete_claude_md(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> JSONResponse:
    service.delete_settings(db, user_id=user_id)
    return Response.success(data={"deleted": True}, message="CLAUDE.md deleted")
