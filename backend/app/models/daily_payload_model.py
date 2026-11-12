"""Daily log payload domain model."""

from typing import ClassVar

from pydantic import BaseModel, Field

from app.constants.app_constants import AppConstants
from app.models.custom_additions import CustomAdditions
from app.models.environmental_model import EnvironmentalModel


class DailyPayloadModel(BaseModel):
    """Represents a full daily log file stored as logs/YYYY-MM-DD.json in Google Drive."""

    _EMPTY_NOTES: ClassVar[str] = ""

    date: str = Field(pattern=AppConstants.get_iso_date_pattern())
    location: str
    environmental_data: EnvironmentalModel | None = None
    standard_responses: dict[str, str | list[str]] = Field(default_factory=dict)
    custom_additions: CustomAdditions = Field(default_factory=CustomAdditions)
    free_form_notes: str = _EMPTY_NOTES

