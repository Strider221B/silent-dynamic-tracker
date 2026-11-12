"""Unit tests for SummaryIndexModel."""

import pytest
from pydantic import ValidationError

from app.models.summary_index_entry import SummaryIndexEntry
from app.models.summary_index_model import SummaryIndexModel


class TestSummaryIndexModel:
    """Verifies collection behavior and validation of SummaryIndexModel."""

    _VALID_DATE: str = "2026-11-12"
    _LOCATION: str = "Pune"

    def test_init_defaults_to_empty_entries(self) -> None:
        """Verify empty SummaryIndexModel initializes an empty entry list."""
        index = SummaryIndexModel()
        assert index.entries == []

    def test_init_with_entries_serializes_cleanly(self) -> None:
        """Verify entries list preserves SummaryIndexEntry instances."""
        entry = SummaryIndexEntry(date=self._VALID_DATE, location=self._LOCATION)
        index = SummaryIndexModel(entries=[entry])
        assert len(index.entries) == 1
        assert index.entries[0].date == self._VALID_DATE

    def test_model_validate_rejects_invalid_entry_date(self) -> None:
        """Verify invalid entry inside entries list raises ValidationError."""
        with pytest.raises(ValidationError):
            SummaryIndexModel.model_validate(
                {"entries": [{"date": "invalid-date", "location": self._LOCATION}]}
            )

