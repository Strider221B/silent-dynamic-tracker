const ELLIPSIS = "..." as const;
const MIN_TRUNCATE_LENGTH = 0 as const;
const NEGATIVE_LENGTH_ERROR = "maxLength must be a non-negative integer" as const;

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
};

const HTML_ESCAPE_PATTERN = /[&<>"'/]/g;

/**
 * Trims surrounding whitespace and escapes HTML/XSS control characters.
 */
export function sanitizeText(input: string): string {
  const trimmed = input.trim();
  return trimmed.replace(HTML_ESCAPE_PATTERN, (char) => HTML_ESCAPE_MAP[char]);
}

/**
 * Truncates text to maxLength characters, appending an ellipsis when space permits.
 */
export function truncateText(input: string, maxLength: number): string {
  if (maxLength < MIN_TRUNCATE_LENGTH || !Number.isInteger(maxLength)) {
    throw new RangeError(NEGATIVE_LENGTH_ERROR);
  }

  if (input.length <= maxLength) {
    return input;
  }

  if (maxLength <= ELLIPSIS.length) {
    return input.slice(MIN_TRUNCATE_LENGTH, maxLength);
  }

  return `${input.slice(MIN_TRUNCATE_LENGTH, maxLength - ELLIPSIS.length)}${ELLIPSIS}`;
}

