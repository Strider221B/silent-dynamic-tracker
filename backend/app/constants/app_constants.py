"""Application-wide constants encapsulated in a strict OOP container."""


class AppConstants:
    """Provides immutable application-wide constants for Silent Dynamic Tracker."""

    _DEFAULT_CONFIG_VERSION: str = "1.0"
    _DRIVE_FOLDER_NAME: str = "SilentDynamicTracker"
    _CONFIG_FILE_NAME: str = "config.json"
    _INDEX_FILE_NAME: str = "summary_index.json"
    _LOGS_DIR_NAME: str = "logs"
    _ISO_DATE_PATTERN: str = r"^\d{4}-\d{2}-\d{2}$"
    _QUESTION_TYPE_PATTERN: str = r"^(select_one|select_multiple)$"

    @classmethod
    def get_default_config_version(cls) -> str:
        """Return the default configuration schema version."""
        return cls._DEFAULT_CONFIG_VERSION

    @classmethod
    def get_drive_folder_name(cls) -> str:
        """Return the Google Drive application folder name."""
        return cls._DRIVE_FOLDER_NAME

    @classmethod
    def get_config_file_name(cls) -> str:
        """Return the master configuration filename."""
        return cls._CONFIG_FILE_NAME

    @classmethod
    def get_index_file_name(cls) -> str:
        """Return the summary index filename."""
        return cls._INDEX_FILE_NAME

    @classmethod
    def get_logs_dir_name(cls) -> str:
        """Return the Google Drive logs subdirectory name."""
        return cls._LOGS_DIR_NAME

    @classmethod
    def get_iso_date_pattern(cls) -> str:
        """Return the regex pattern for YYYY-MM-DD ISO calendar dates."""
        return cls._ISO_DATE_PATTERN

    @classmethod
    def get_question_type_pattern(cls) -> str:
        """Return the regex pattern for supported question types."""
        return cls._QUESTION_TYPE_PATTERN

