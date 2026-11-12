"""Unit tests for EpaIndexEnum."""

from app.models.epa_index_enum import EpaIndexEnum


class TestEpaIndexEnum:
    """Verifies US EPA Air Quality Index enum values and completeness."""

    _EXPECTED_COUNT: int = 6
    _GOOD_VAL: int = 1
    _MODERATE_VAL: int = 2
    _SENSITIVE_VAL: int = 3
    _UNHEALTHY_VAL: int = 4
    _VERY_UNHEALTHY_VAL: int = 5
    _HAZARDOUS_VAL: int = 6

    def test_enum_members_have_expected_integer_values(self) -> None:
        """Verify all six US EPA index levels map to integers 1 through 6."""
        assert len(EpaIndexEnum) == self._EXPECTED_COUNT
        assert EpaIndexEnum.GOOD == self._GOOD_VAL
        assert EpaIndexEnum.MODERATE == self._MODERATE_VAL
        assert EpaIndexEnum.UNHEALTHY_FOR_SENSITIVE_GROUPS == self._SENSITIVE_VAL
        assert EpaIndexEnum.UNHEALTHY == self._UNHEALTHY_VAL
        assert EpaIndexEnum.VERY_UNHEALTHY == self._VERY_UNHEALTHY_VAL
        assert EpaIndexEnum.HAZARDOUS == self._HAZARDOUS_VAL

