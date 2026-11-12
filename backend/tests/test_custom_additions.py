"""Unit tests for CustomAdditions."""

import pytest
from pydantic import ValidationError

from app.models.custom_additions import CustomAdditions
from app.models.custom_question_addition import CustomQuestionAddition


class TestCustomAdditions:
    """Verifies schema behavior for CustomAdditions container."""

    _QUESTION: str = "Mood"
    _TYPE: str = "select_one"
    _SELECTIONS: list[str] = ["Calm"]

    def test_init_defaults_to_empty_custom_questions(self) -> None:
        """Verify empty CustomAdditions initializes empty custom_questions list."""
        additions = CustomAdditions()
        assert additions.custom_questions == []

    def test_init_with_custom_question_list_succeeds(self) -> None:
        """Verify nested CustomQuestionAddition items are preserved."""
        item = CustomQuestionAddition(
            question=self._QUESTION,
            type=self._TYPE,
            selections=self._SELECTIONS,
        )
        additions = CustomAdditions(custom_questions=[item])
        assert len(additions.custom_questions) == 1
        assert additions.custom_questions[0].selections == self._SELECTIONS

    def test_model_validate_invalid_custom_questions_fails(self) -> None:
        """Verify non-list custom_questions raises ValidationError."""
        with pytest.raises(ValidationError):
            CustomAdditions.model_validate({"custom_questions": "invalid"})

