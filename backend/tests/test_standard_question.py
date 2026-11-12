"""Unit tests for StandardQuestion."""

import pytest
from pydantic import ValidationError

from app.models.standard_question import StandardQuestion


class TestStandardQuestion:
    """Verifies schema validation for StandardQuestion."""

    _Q_ID: str = "energy_level"
    _Q_TEXT: str = "How was your energy today?"
    _TYPE_ONE: str = "select_one"
    _TYPE_MULTI: str = "select_multiple"
    _INVALID_TYPE: str = "text_input"
    _OPTIONS: list[str] = ["High", "Moderate", "Exhausted"]
    _DEFAULT_ONE: str = "Moderate"
    _DEFAULT_MULTI: list[str] = ["High"]

    def test_init_select_one_valid(self) -> None:
        """Verify valid select_one question passes validation."""
        question = StandardQuestion(
            id=self._Q_ID,
            question=self._Q_TEXT,
            type=self._TYPE_ONE,
            options=self._OPTIONS,
            default=self._DEFAULT_ONE,
        )
        assert question.id == self._Q_ID
        assert question.type == self._TYPE_ONE
        assert question.default == self._DEFAULT_ONE

    def test_init_select_multiple_with_list_default_valid(self) -> None:
        """Verify valid select_multiple question with list default passes."""
        question = StandardQuestion(
            id=self._Q_ID,
            question=self._Q_TEXT,
            type=self._TYPE_MULTI,
            options=self._OPTIONS,
            default=self._DEFAULT_MULTI,
        )
        assert question.type == self._TYPE_MULTI
        assert question.default == self._DEFAULT_MULTI

    def test_init_invalid_type_raises_validation_error(self) -> None:
        """Verify unsupported question type triggers ValidationError."""
        with pytest.raises(ValidationError):
            StandardQuestion(
                id=self._Q_ID,
                question=self._Q_TEXT,
                type=self._INVALID_TYPE,
                options=self._OPTIONS,
                default=self._DEFAULT_ONE,
            )

