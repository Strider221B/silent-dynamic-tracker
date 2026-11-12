"""Environmental data source enumeration."""

from enum import StrEnum


class EnvironmentalSourceEnum(StrEnum):
    """Indicates how environmental data was acquired for a daily log."""

    API = "api"
    MANUAL = "manual"

