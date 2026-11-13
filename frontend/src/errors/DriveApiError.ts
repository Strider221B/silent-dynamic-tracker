/**
 * Custom error class representing Google Drive REST API failures.
 */
export class DriveApiError extends Error {
  public readonly statusCode: number;
  public readonly endpoint?: string;

  /**
   * Initializes a new instance of DriveApiError.
   *
   * @param message - Descriptive failure message.
   * @param statusCode - HTTP status code returned by Google Drive API.
   * @param endpoint - Optional API endpoint where the failure originated.
   */
  constructor(message: string, statusCode: number, endpoint?: string) {
    super(message);
    this.name = "DriveApiError";
    this.statusCode = statusCode;
    this.endpoint = endpoint;
    Object.setPrototypeOf(this, DriveApiError.prototype);
  }
}

