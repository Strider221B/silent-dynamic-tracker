"""Unit tests for DailyPayloadModel."""

from typing import Any

import pytest
from pydantic import ValidationError

from app.models.daily_payload_model import DailyPayloadModel


class TestDailyPayloadModel:
    """Verifies validation, defaults, and nested serialization of DailyPayloadModel."""

    _VALID_DATE: str = "2026-11-09"
    _INVALID_DATE: str = "09-11-2026"
    _LOCATION: str = "Mumbai"

    @pytest.fixture
    def full_payload_dict(self) -> dict[str, Any]:
        """Return a complete daily payload dictionary matching logs/YYYY-MM-DD.json."""
        return {
            "date": self._VALID_DATE,
            "location": self._LOCATION,
            "environmental_data": {
                "temperature": "31C",
                "condition": "Clear",
                "aqi": "Moderate",
                "aqi_numeric": 2,
                "pm25": 36.4,
                "source": "api",
            },
            "standard_responses": {
                "energy_level": "Moderate",
                "interacted_with": ["Family", "Pets"],
            },
            "custom_additions": {
                "custom_questions": [
                    {
                        "question": "Symptoms",
                        "type": "select_multiple",
                        "selections": ["Headache"],
                    }
                ]
            },
            "free_form_notes": "Productive evening.",
        }

    def test_init_with_minimal_fields_sets_expected_defaults(self) -> None:
        """Verify missing optional fields default to None, empty dicts/lists, and empty notes."""
        payload = DailyPayloadModel(date=self._VALID_DATE, location=self._LOCATION)
        assert payload.date == self._VALID_DATE
        assert payload.location == self._LOCATION
        assert payload.environmental_data is None
        assert payload.standard_responses == {}
        assert payload.custom_additions.custom_questions == []
        assert payload.free_form_notes == ""

    def test_model_validate_full_payload_preserves_nested_models(
        self, full_payload_dict: dict[str, Any]
    ) -> None:
        """Verify full nested payload deserializes and serializes cleanly."""
        payload = DailyPayloadModel.model_validate(full_payload_dict)
        assert payload.environmental_data is not None
        assert payload.environmental_data.aqi == "Moderate"
        assert len(payload.custom_additions.custom_questions) == 1
        assert payload.model_dump(mode="json") == full_payload_dict

    def test_init_invalid_date_raises_validation_error(self) -> None:
        """Verify invalid date format raises ValidationError."""
        with pytest.raises(ValidationError):
            DailyPayloadModel(date=self._INVALID_DATE, location=self._LOCATION)

