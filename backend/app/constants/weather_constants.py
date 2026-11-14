"""Weather API configuration constants and US EPA index mappings."""

from typing import ClassVar

from app.models.epa_index_enum import EpaIndexEnum


class WeatherConstants:
    """Provides constants and mapping utilities for WeatherAPI.com integrations."""

    _BASE_URL: ClassVar[str] = "https://api.weatherapi.com/v1"
    _CURRENT_ENDPOINT: ClassVar[str] = "/current.json"
    _DEFAULT_TIMEOUT_SECONDS: ClassVar[float] = 5.0
    _UNKNOWN_LABEL: ClassVar[str] = "Unknown"
    _EPA_LABELS: ClassVar[dict[int, str]] = {
        int(EpaIndexEnum.GOOD): "Good",
        int(EpaIndexEnum.MODERATE): "Moderate",
        int(EpaIndexEnum.UNHEALTHY_FOR_SENSITIVE_GROUPS): "Unhealthy for Sensitive Groups",
        int(EpaIndexEnum.UNHEALTHY): "Unhealthy",
        int(EpaIndexEnum.VERY_UNHEALTHY): "Very Unhealthy",
        int(EpaIndexEnum.HAZARDOUS): "Hazardous",
    }

    @classmethod
    def get_base_url(cls) -> str:
        """Return the base URL for WeatherAPI.com."""
        return cls._BASE_URL

    @classmethod
    def get_current_endpoint(cls) -> str:
        """Return the relative path to the current weather endpoint."""
        return cls._CURRENT_ENDPOINT

    @classmethod
    def get_default_timeout_seconds(cls) -> float:
        """Return the default HTTP request timeout in seconds."""
        return cls._DEFAULT_TIMEOUT_SECONDS

    @classmethod
    def get_epa_labels(cls) -> dict[int, str]:
        """Return a copy of the numeric to human-readable EPA label map."""
        return dict(cls._EPA_LABELS)

    @classmethod
    def get_unknown_label(cls) -> str:
        """Return the fallback label for unmapped or invalid EPA indices."""
        return cls._UNKNOWN_LABEL

    @classmethod
    def map_epa_index(cls, index: int | None) -> str:
        """Map a numeric EPA air quality index (1-6) to its descriptive label."""
        if index is None:
            return cls._UNKNOWN_LABEL
        return cls._EPA_LABELS.get(index, cls._UNKNOWN_LABEL)

