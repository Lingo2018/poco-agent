from pydantic import BaseModel


class ComputerBrowserScreenshotResponse(BaseModel):
    tool_use_id: str
    url: str
