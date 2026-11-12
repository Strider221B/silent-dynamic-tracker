"""Unit tests for EnvironmentalSourceEnum."""

from app.models.environmental_source_enum import EnvironmentalSourceEnum


class TestEnvironmentalSourceEnum:
    """Verifies environmental data source enum values."""

    _EXPECTED_COUNT: int = 2
    _API_STR: str = "api"
    _MANUAL_STR: str = "manual"

    def test_enum_members_match_expected_strings(self) -> None:
        """Verify api and manual source values."""
        assert len(EnvironmentalSourceEnum) == self._EXPECTED_COUNT
        assert EnvironmentalSourceEnum.API == self._API_STR
        assert EnvironmentalSourceEnum.MANUAL == self._MANUAL_STR

