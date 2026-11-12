"""Master application configuration domain model."""

from pydantic import BaseModel, Field

from app.constants.app_constants import AppConstants
from app.models.saved_custom_question import SavedCustomQuestion
from app.models.standard_question import StandardQuestion


class ConfigModel(BaseModel):
    """Represents the master config.json schema stored in Google Drive."""

    version: str = Field(default_factory=AppConstants.get_default_config_version)
    standard_questions: list[StandardQuestion] = Field(default_factory=list)
    custom_saved_questions: list[SavedCustomQuestion] = Field(default_factory=list)

