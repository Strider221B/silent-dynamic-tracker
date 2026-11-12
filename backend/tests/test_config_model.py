"""Unit tests for ConfigModel."""

from typing import Any

import pytest
from pydantic import ValidationError

from app.constants.app_constants import AppConstants
from app.models.config_model import ConfigModel


class TestConfigModel:
    """Verifies serialization, defaults, and validation of ConfigModel."""

    _CUSTOM_VERSION: str = "2.0"

    @pytest.fixture
    def sample_config_dict(self) -> dict[str, Any]:
        """Return a valid config dictionary matching config.json schema."""
        return {
            "version": AppConstants.get_default_config_version(),
            "standard_questions": [
                {
                    "id": "energy_level",
                    "question": "How was your energy today?",
                    "type": "select_one",
                    "options": ["High", "Moderate", "Exhausted"],
                    "default": "Moderate",
                }
            ],
            "custom_saved_questions": [
                {
                    "id": "custom_symptoms",
                    "question": "Symptoms",
                    "type": "select_multiple",
                    "options": ["Headache", "Fatigue"],
                    "default": [],
                }
            ],
        }

    def test_init_defaults_use_expected_version_and_empty_lists(self) -> None:
        """Verify empty ConfigModel sets default version and empty question lists."""
        config = ConfigModel()
        assert config.version == AppConstants.get_default_config_version()
        assert config.standard_questions == []
        assert config.custom_saved_questions == []

    def test_model_validate_and_dump_round_trip(self, sample_config_dict: dict[str, Any]) -> None:
        """Verify JSON serialization and deserialization preserve all fields."""
        config = ConfigModel.model_validate(sample_config_dict)
        assert len(config.standard_questions) == 1
        assert len(config.custom_saved_questions) == 1
        dumped = config.model_dump()
        assert dumped == sample_config_dict

    def test_init_custom_version_overrides_default(self) -> None:
        """Verify explicit version overrides default version."""
        config = ConfigModel(version=self._CUSTOM_VERSION)
        assert config.version == self._CUSTOM_VERSION

    def test_model_validate_invalid_standard_questions_type_fails(self) -> None:
        """Verify non-list standard_questions triggers ValidationError."""
        with pytest.raises(ValidationError):
            ConfigModel.model_validate({"standard_questions": "not_a_list"})

