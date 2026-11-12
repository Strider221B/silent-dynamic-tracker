"""Summary index collection domain model."""

from pydantic import BaseModel, Field

from app.models.summary_index_entry import SummaryIndexEntry


class SummaryIndexModel(BaseModel):
    """Represents the lightweight summary_index.json collection stored in Google Drive."""

    entries: list[SummaryIndexEntry] = Field(default_factory=list)

