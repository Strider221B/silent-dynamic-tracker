"""Custom additions container domain model."""

from pydantic import BaseModel, Field

from app.models.custom_question_addition import CustomQuestionAddition


class CustomAdditions(BaseModel):
    """Groups session-specific custom question additions for a daily log."""

    custom_questions: list[CustomQuestionAddition] = Field(default_factory=list)

