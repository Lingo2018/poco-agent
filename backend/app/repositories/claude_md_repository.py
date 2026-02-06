from sqlalchemy.orm import Session

from app.models.claude_md import UserClaudeMdSetting


class ClaudeMdRepository:
    @staticmethod
    def get_by_user_id(session_db: Session, user_id: str) -> UserClaudeMdSetting | None:
        return (
            session_db.query(UserClaudeMdSetting)
            .filter(UserClaudeMdSetting.user_id == user_id)
            .first()
        )

    @staticmethod
    def create(
        session_db: Session, setting: UserClaudeMdSetting
    ) -> UserClaudeMdSetting:
        session_db.add(setting)
        return setting

    @staticmethod
    def delete(session_db: Session, setting: UserClaudeMdSetting) -> None:
        session_db.delete(setting)
