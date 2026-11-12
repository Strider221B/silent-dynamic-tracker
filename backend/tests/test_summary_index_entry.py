"""Unit tests for SummaryIndexEntry."""

import pytest
from pydantic import ValidationError

from app.models.summary_index_entry import SummaryIndexEntry


class TestSummaryIndexEntry:
    """Verifies validation and defaults of SummaryIndexEntry."""

    _VALID_DATE: str = "2026-11-09"
    _INVALID_DATE_SLASH: str = "2026/11/09"
    _INVALID_DATE_SHORT: str = "26-11-09"
    _LOCATION: str = "Mumbai"
    _WEATHER_SUMMARY: str = "31°C, Clear"
    _AQI_SUMMARY: str = "Moderate"

    def test_init_with_minimal_fields_sets_defaults(self) -> None:
        """Verify required fields with default optional values."""
        entry = SummaryIndexEntry(date=self._VALID_DATE, location=self._LOCATION)
        assert entry.date == self._VALID_DATE
        assert entry.location == self._LOCATION
        assert entry.weather_summary is None
        assert entry.aqi_summary is None
        assert entry.mcq_responses == {}
        assert entry.custom_entries_exist is False

    def test_init_with_full_fields_succeeds(self) -> None:
        """Verify entry stores weather, AQI, MCQ responses, and custom flag."""
        responses: dict[str, str | list[str]] = {
            "energy_level": "Moderate",
            "interacted_with": ["Family", "Pets"],
        }
        entry = SummaryIndexEntry(
            date=self._VALID_DATE,
            location=self._LOCATION,
            weather_summary=self._WEATHER_SUMMARY,
            aqi_summary=self._AQI_SUMMARY,
            mcq_responses=responses,
            custom_entries_exist=True,
        )
        assert entry.weather_summary == self._WEATHER_SUMMARY
        assert entry.aqi_summary == self._AQI_SUMMARY
        assert entry.mcq_responses == responses
        assert entry.custom_entries_exist is True

    @pytest.mark.parametrize("bad_date", [_INVALID_DATE_SLASH, _INVALID_DATE_SHORT, ""])
    def test_init_invalid_date_format_raises_validation_error(self, bad_date: str) -> None:
        """Verify non-YYYY-MM-DD dates are rejected."""
        with pytest.raises(ValidationError):
            SummaryIndexEntry(date=bad_date, location=self._LOCATION)

