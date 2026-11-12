"""Unit tests for AppConstants."""

import re

from app.constants.app_constants import AppConstants


class TestAppConstants:
    """Verifies all application-wide constant getters."""

    _EXPECTED_VERSION: str = "1.0"
    _EXPECTED_FOLDER: str = "SilentDynamicTracker"
    _EXPECTED_CONFIG_FILE: str = "config.json"
    _EXPECTED_INDEX_FILE: str = "summary_index.json"
    _EXPECTED_LOGS_DIR: str = "logs"
    _VALID_DATE_SAMPLE: str = "2026-11-12"
    _INVALID_DATE_SAMPLE: str = "12-11-2026"
    _VALID_TYPE_ONE: str = "select_one"
    _VALID_TYPE_MULTI: str = "select_multiple"
    _INVALID_TYPE: str = "free_text"

    def test_get_default_config_version_returns_expected_string(self) -> None:
        """Verify default config version matches schema v1.0."""
        assert AppConstants.get_default_config_version() == self._EXPECTED_VERSION

    def test_get_drive_folder_name_returns_expected_string(self) -> None:
        """Verify Google Drive folder name constant."""
        assert AppConstants.get_drive_folder_name() == self._EXPECTED_FOLDER

    def test_get_config_file_name_returns_expected_string(self) -> None:
        """Verify config file name constant."""
        assert AppConstants.get_config_file_name() == self._EXPECTED_CONFIG_FILE

    def test_get_index_file_name_returns_expected_string(self) -> None:
        """Verify summary index file name constant."""
        assert AppConstants.get_index_file_name() == self._EXPECTED_INDEX_FILE

    def test_get_logs_dir_name_returns_expected_string(self) -> None:
        """Verify logs directory name constant."""
        assert AppConstants.get_logs_dir_name() == self._EXPECTED_LOGS_DIR

    def test_get_iso_date_pattern_matches_valid_and_rejects_invalid(self) -> None:
        """Verify ISO date regex matches YYYY-MM-DD and rejects other formats."""
        pattern = AppConstants.get_iso_date_pattern()
        assert re.match(pattern, self._VALID_DATE_SAMPLE) is not None
        assert re.match(pattern, self._INVALID_DATE_SAMPLE) is None

    def test_get_question_type_pattern_matches_supported_types(self) -> None:
        """Verify question type regex accepts select_one/select_multiple only."""
        pattern = AppConstants.get_question_type_pattern()
        assert re.match(pattern, self._VALID_TYPE_ONE) is not None
        assert re.match(pattern, self._VALID_TYPE_MULTI) is not None
        assert re.match(pattern, self._INVALID_TYPE) is None

