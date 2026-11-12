"""US EPA Air Quality Index numeric enumeration."""

from enum import IntEnum


class EpaIndexEnum(IntEnum):
    """Represents the US EPA Air Quality Index scale (1 through 6)."""

    GOOD = 1
    MODERATE = 2
    UNHEALTHY_FOR_SENSITIVE_GROUPS = 3
    UNHEALTHY = 4
    VERY_UNHEALTHY = 5
    HAZARDOUS = 6

