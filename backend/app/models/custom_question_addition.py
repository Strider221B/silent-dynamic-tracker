"""Ad-hoc custom question addition domain model."""

from pydantic import BaseModel


class CustomQuestionAddition(BaseModel):
    """Represents a session-only custom question entry inside a daily log payload."""

    question: str
    type: str
    selections: list[str]

