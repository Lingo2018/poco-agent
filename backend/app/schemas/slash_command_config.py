from typing import Literal

from pydantic import BaseModel, Field


class SlashCommandResolveRequest(BaseModel):
    """Request to resolve enabled slash commands for execution."""

    names: list[str] = Field(default_factory=list)
    # Explicit skill names for the current run. `None` means backend defaults.
    skill_names: list[str] | None = None


SlashCommandSuggestionSource = Literal["custom", "skill"]


class SlashCommandSuggestionResponse(BaseModel):
    name: str
    description: str | None = None
    argument_hint: str | None = None
    source: SlashCommandSuggestionSource
