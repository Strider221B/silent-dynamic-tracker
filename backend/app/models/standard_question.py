"""Standard checklist question domain model."""

from pydantic import BaseModel, Field

from app.constants.app_constants import AppConstants


class StandardQuestion(BaseModel):
    """Defines a checklist question block and its default selection."""

    id: str
    question: str
    type: str = Field(pattern=AppConstants.get_question_type_pattern())
    options: list[str]
    default: str | list[str]

