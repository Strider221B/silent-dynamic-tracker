/**
 * Google Identity Services and OAuth 2.0 constants.
 */

export const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file" as const;

export const DEFAULT_CLIENT_ID =
  "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com" as const;

export const GOOGLE_CLIENT_ID: string =
  (import.meta.env?.VITE_GOOGLE_CLIENT_ID as string | undefined) ||
  DEFAULT_CLIENT_ID;

export const TOKEN_EXPIRY_BUFFER_MS = 60000 as const;

