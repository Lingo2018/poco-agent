from sqlalchemy import Boolean, JSON, String, Text, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, TimestampMixin


class SubAgent(Base, TimestampMixin):
    __tablename__ = "sub_agents"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    mode: Mapped[str] = mapped_column(
        String(20),
        default="structured",
        server_default=text("'structured'"),
        nullable=False,
    )
    enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default=text("true"),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    tools: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    model: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # When mode="raw", the sub agent is stored as a full Markdown file
    # (including YAML front matter).
    raw_markdown: Mapped[str | None] = mapped_column(Text, nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_sub_agent_user_name"),
        {"sqlite_autoincrement": True},
    )
