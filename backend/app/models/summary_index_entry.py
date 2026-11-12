"""Summary index entry domain model."""

from pydantic import BaseModel, Field

from app.constants.app_constants import AppConstants


class SummaryIndexEntry(BaseModel):
    """Represents metadata for a single logged day inside summary_index.json."""

    date: str = Field(pattern=AppConstants.get_iso_date_pattern())
    location: str
    weather_summary: str | None = None
    aqi_summary: str | None = None
    mcq_responses: dict[str, str | list[str]] = Field(default_factory=dict)
    custom_entries_exist: bool = False

