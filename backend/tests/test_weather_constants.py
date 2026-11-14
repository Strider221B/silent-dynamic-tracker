"""Unit tests for WeatherConstants."""

import pytest

from app.constants.weather_constants import WeatherConstants
from app.models.epa_index_enum import EpaIndexEnum


class TestWeatherConstants:
    """Test suite verifying WeatherConstants behavior and mapping integrity."""

    def test_get_base_url_returns_expected_url(self) -> None:
        """Verify get_base_url returns the WeatherAPI root URL."""
        assert WeatherConstants.get_base_url() == "https://api.weatherapi.com/v1"

    def test_get_current_endpoint_returns_expected_path(self) -> None:
        """Verify get_current_endpoint returns the current weather path."""
        assert WeatherConstants.get_current_endpoint() == "/current.json"

    def test_get_default_timeout_seconds_returns_five_seconds(self) -> None:
        """Verify default timeout value is 5.0 seconds."""
        assert WeatherConstants.get_default_timeout_seconds() == 5.0

    def test_get_unknown_label_returns_unknown(self) -> None:
        """Verify fallback EPA index label is 'Unknown'."""
        assert WeatherConstants.get_unknown_label() == "Unknown"

    def test_get_epa_labels_contains_all_six_levels(self) -> None:
        """Verify get_epa_labels returns complete 1-6 mapping dictionary."""
        labels = WeatherConstants.get_epa_labels()
        assert len(labels) == 6
        assert labels[int(EpaIndexEnum.GOOD)] == "Good"
        assert labels[int(EpaIndexEnum.HAZARDOUS)] == "Hazardous"

    @pytest.mark.parametrize(
        ("index", "expected_label"),
        [
            (1, "Good"),
            (2, "Moderate"),
            (3, "Unhealthy for Sensitive Groups"),
            (4, "Unhealthy"),
            (5, "Very Unhealthy"),
            (6, "Hazardous"),
        ],
    )
    def test_map_epa_index_valid_indices(self, index: int, expected_label: str) -> None:
        """Verify valid 1-6 EPA indices map to corresponding descriptive labels."""
        assert WeatherConstants.map_epa_index(index) == expected_label

    @pytest.mark.parametrize(
        "invalid_index",
        [None, 0, 7, -1, 99],
    )
    def test_map_epa_index_invalid_or_none(self, invalid_index: int | None) -> None:
        """Verify invalid or None indices map to 'Unknown'."""
        assert WeatherConstants.map_epa_index(invalid_index) == "Unknown"

