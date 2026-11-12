"""Unit tests for SavedCustomQuestion."""

import pytest
from pydantic import ValidationError

from app.models.saved_custom_question import SavedCustomQuestion


class TestSavedCustomQuestion:
    """Verifies schema validation for SavedCustomQuestion."""

    _Q_ID: str = "custom_symptoms"
    _Q_TEXT: str = "Symptoms"
    _TYPE_MULTI: str = "select_multiple"
    _INVALID_TYPE: str = "radio"
    _OPTIONS: list[str] = ["Headache", "Fatigue"]
    _EMPTY_DEFAULT: list[str] = []

    def test_init_valid_custom_question_with_empty_default(self) -> None:
        """Verify valid SavedCustomQuestion accepts empty default list."""
        question = SavedCustomQuestion(
            id=self._Q_ID,
            question=self._Q_TEXT,
            type=self._TYPE_MULTI,
            options=self._OPTIONS,
            default=self._EMPTY_DEFAULT,
        )
        assert question.id == self._Q_ID
        assert question.options == self._OPTIONS
        assert question.default == self._EMPTY_DEFAULT

    def test_init_invalid_type_raises_validation_error(self) -> None:
        """Verify invalid question type is rejected."""
        with pytest.raises(ValidationError):
            SavedCustomQuestion(
                id=self._Q_ID,
                question=self._Q_TEXT,
                type=self._INVALID_TYPE,
                options=self._OPTIONS,
                default=self._EMPTY_DEFAULT,
            )

