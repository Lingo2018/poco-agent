from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.user_mcp_install import UserMcpInstall


class UserMcpInstallRepository:
    @staticmethod
    def create(session_db: Session, install: UserMcpInstall) -> UserMcpInstall:
        session_db.add(install)
        return install

    @staticmethod
    def get_by_id(session_db: Session, install_id: int) -> UserMcpInstall | None:
        return (
            session_db.query(UserMcpInstall)
            .filter(UserMcpInstall.id == install_id)
            .first()
        )

    @staticmethod
    def get_by_user_and_server(
        session_db: Session, user_id: str, server_id: int
    ) -> UserMcpInstall | None:
        return (
            session_db.query(UserMcpInstall)
            .filter(
                UserMcpInstall.user_id == user_id,
                UserMcpInstall.server_id == server_id,
            )
            .first()
        )

    @staticmethod
    def list_by_user(session_db: Session, user_id: str) -> list[UserMcpInstall]:
        return (
            session_db.query(UserMcpInstall)
            .filter(UserMcpInstall.user_id == user_id)
            .order_by(UserMcpInstall.created_at.desc())
            .all()
        )

    @staticmethod
    def bulk_set_enabled(
        session_db: Session,
        *,
        user_id: str,
        enabled: bool,
        install_ids: list[int] | None = None,
    ) -> int:
        query = session_db.query(UserMcpInstall).filter(
            UserMcpInstall.user_id == user_id
        )
        if install_ids is not None:
            if not install_ids:
                return 0
            query = query.filter(UserMcpInstall.id.in_(install_ids))
        return query.update(
            {
                UserMcpInstall.enabled: enabled,
                UserMcpInstall.updated_at: func.now(),
            },
            synchronize_session=False,
        )

    @staticmethod
    def delete(session_db: Session, install: UserMcpInstall) -> None:
        session_db.delete(install)
