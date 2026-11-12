"""Environmental data domain model for weather and AQI metrics."""

from typing import ClassVar

from pydantic import BaseModel, Field

from app.models.environmental_source_enum import EnvironmentalSourceEnum
from app.models.epa_index_enum import EpaIndexEnum


class EnvironmentalModel(BaseModel):
    """Represents weather and air quality metadata attached to a daily log."""

    _MIN_EPA_INDEX: ClassVar[int] = int(EpaIndexEnum.GOOD)
    _MAX_EPA_INDEX: ClassVar[int] = int(EpaIndexEnum.HAZARDOUS)
    _MIN_PM25: ClassVar[float] = 0.0

    temperature: str | None = None
    condition: str | None = None
    aqi: str | None = None
    aqi_numeric: int | None = Field(default=None, ge=_MIN_EPA_INDEX, le=_MAX_EPA_INDEX)
    pm25: float | None = Field(default=None, ge=_MIN_PM25)
    source: EnvironmentalSourceEnum | None = None

