"""Unit tests for CustomQuestionAddition."""

import pytest
from pydantic import ValidationError

from app.models.custom_question_addition import CustomQuestionAddition


class TestCustomQuestionAddition:
    """Verifies schema validation for CustomQuestionAddition."""

    _QUESTION: str = "Symptoms"
    _TYPE: str = "select_multiple"
    _SELECTIONS: list[str] = ["Headache"]

    def test_init_valid_custom_addition(self) -> None:
        """Verify valid ad-hoc custom question addition stores all fields."""
        addition = CustomQuestionAddition(
            question=self._QUESTION,
            type=self._TYPE,
            selections=self._SELECTIONS,
        )
        assert addition.question == self._QUESTION
        assert addition.type == self._TYPE
        assert addition.selections == self._SELECTIONS

    def test_model_validate_missing_selections_raises_validation_error(self) -> None:
        """Verify missing required selections field fails validation."""
        with pytest.raises(ValidationError):
            CustomQuestionAddition.model_validate(
                {"question": self._QUESTION, "type": self._TYPE}
            )

