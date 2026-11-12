"""Unit tests for EnvironmentalModel."""

import pytest
from pydantic import ValidationError

from app.models.environmental_model import EnvironmentalModel
from app.models.environmental_source_enum import EnvironmentalSourceEnum
from app.models.epa_index_enum import EpaIndexEnum


class TestEnvironmentalModel:
    """Verifies validation and serialization of EnvironmentalModel."""

    _TEMP: str = "31C"
    _CONDITION: str = "Clear"
    _AQI_TEXT: str = "Moderate"
    _PM25_VALID: float = 36.4
    _PM25_ZERO: float = 0.0
    _PM25_NEGATIVE: float = -0.1
    _EPA_BELOW_MIN: int = 0
    _EPA_ABOVE_MAX: int = 7
    _INVALID_SOURCE: str = "gps"

    def test_init_defaults_all_fields_to_none(self) -> None:
        """Verify empty model initializes all optional fields as None."""
        model = EnvironmentalModel()
        assert model.temperature is None
        assert model.condition is None
        assert model.aqi is None
        assert model.aqi_numeric is None
        assert model.pm25 is None
        assert model.source is None

    def test_init_with_valid_data_populates_fields(self) -> None:
        """Verify valid weather and AQI fields are stored accurately."""
        model = EnvironmentalModel(
            temperature=self._TEMP,
            condition=self._CONDITION,
            aqi=self._AQI_TEXT,
            aqi_numeric=int(EpaIndexEnum.MODERATE),
            pm25=self._PM25_VALID,
            source=EnvironmentalSourceEnum.API,
        )
        assert model.temperature == self._TEMP
        assert model.condition == self._CONDITION
        assert model.aqi == self._AQI_TEXT
        assert model.aqi_numeric == int(EpaIndexEnum.MODERATE)
        assert model.pm25 == self._PM25_VALID
        assert model.source == EnvironmentalSourceEnum.API

    @pytest.mark.parametrize("index_value", [int(EpaIndexEnum.GOOD), int(EpaIndexEnum.HAZARDOUS)])
    def test_aqi_numeric_boundary_values_succeed(self, index_value: int) -> None:
        """Verify lower (1) and upper (6) EPA index boundaries are accepted."""
        model = EnvironmentalModel(aqi_numeric=index_value)
        assert model.aqi_numeric == index_value

    @pytest.mark.parametrize("invalid_index", [_EPA_BELOW_MIN, _EPA_ABOVE_MAX])
    def test_aqi_numeric_out_of_range_raises_validation_error(self, invalid_index: int) -> None:
        """Verify EPA indices below 1 or above 6 fail validation."""
        with pytest.raises(ValidationError):
            EnvironmentalModel(aqi_numeric=invalid_index)

    def test_pm25_zero_boundary_succeeds(self) -> None:
        """Verify PM2.5 accepts exact zero value."""
        model = EnvironmentalModel(pm25=self._PM25_ZERO)
        assert model.pm25 == self._PM25_ZERO

    def test_pm25_negative_raises_validation_error(self) -> None:
        """Verify negative PM2.5 fails validation."""
        with pytest.raises(ValidationError):
            EnvironmentalModel(pm25=self._PM25_NEGATIVE)

    def test_source_accepts_manual_and_rejects_unknown(self) -> None:
        """Verify source enum accepts 'manual' and rejects invalid strings."""
        model = EnvironmentalModel(source=EnvironmentalSourceEnum.MANUAL)
        assert model.source == EnvironmentalSourceEnum.MANUAL
        with pytest.raises(ValidationError):
            EnvironmentalModel.model_validate({"source": self._INVALID_SOURCE})
