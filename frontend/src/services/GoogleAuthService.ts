import { DRIVE_FILE_SCOPE, GOOGLE_CLIENT_ID } from "@/constants/authConstants";
import type { ITokenClient, ITokenResponse } from "@/types/google";

/**
 * Service encapsulating Google Identity Services (GIS) OAuth 2.0 token management.
 * Keeps tokens strictly in-memory with zero local persistence.
 */
export class GoogleAuthService {
  private static readonly _TOKEN_EXPIRY_BUFFER_MS = 60000;
  private static readonly _REVOKE_ENDPOINT =
    "https://oauth2.googleapis.com/revoke";
  private static readonly _DEFAULT_EXPIRES_IN_SECONDS = 3600;
  private static readonly _RADIX_DECIMAL = 10;
  private static readonly _PROMPT_NONE = "";

  private readonly _clientId: string;
  private _tokenClient: ITokenClient | null = null;
  private _accessToken: string | null = null;
  private _tokenExpiresAt: number | null = null;
  private _userCallback: ((token: string) => void) | null = null;

  /**
   * Initializes the GoogleAuthService.
   *
   * @param clientId - Optional Google OAuth Client ID.
   */
  constructor(clientId: string = GOOGLE_CLIENT_ID) {
    this._clientId = clientId;
  }

  /**
   * Initializes the GIS token client with a callback for token acquisition.
   *
   * @param callback - Function invoked upon receiving a valid access token.
   */
  public initClient(callback: (token: string) => void): void {
    this._userCallback = callback;
    if (typeof window === "undefined" || !window.google?.accounts?.oauth2) {
      return;
    }

    this._tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: this._clientId,
      scope: DRIVE_FILE_SCOPE,
      callback: (response: ITokenResponse) => {
        this._handleTokenResponse(response);
      },
    });
  }

  /**
   * Triggers the GIS token consent dialog or silent refresh.
   */
  public requestAccessToken(): void {
    if (!this._tokenClient) {
      if (this._userCallback) {
        this.initClient(this._userCallback);
      }
    }

    if (!this._tokenClient) {
      throw new Error("Google Identity Services not initialized");
    }

    this._tokenClient.requestAccessToken({ prompt: GoogleAuthService._PROMPT_NONE });
  }

  /**
   * Retrieves the currently active access token, or null if expired or missing.
   */
  public getAccessToken(): string | null {
    if (!this.isAuthenticated()) {
      return null;
    }
    return this._accessToken;
  }

  /**
   * Revokes the active token and purges all credentials from memory.
   */
  public async revokeToken(): Promise<void> {
    const token = this._accessToken;
    this._clearToken();

    if (!token) {
      return;
    }

    const revokeFn =
      typeof window !== "undefined"
        ? window.google?.accounts?.oauth2?.revoke
        : undefined;

    if (revokeFn) {
      await new Promise<void>((resolve) => {
        revokeFn(token, () => {
          resolve();
        });
      });
      return;
    }

    await this._fetchRevoke(token);
  }

  /**
   * Checks whether a valid, non-expired access token is active in memory.
   */
  public isAuthenticated(): boolean {
    if (!this._accessToken || !this._tokenExpiresAt) {
      return false;
    }
    const remainingTime = this._tokenExpiresAt - Date.now();
    return remainingTime > GoogleAuthService._TOKEN_EXPIRY_BUFFER_MS;
  }

  private _handleTokenResponse(response: ITokenResponse): void {
    if (response.error || !response.access_token) {
      this._clearToken();
      return;
    }

    const rawExpires = response.expires_in;
    const parsedExpires =
      typeof rawExpires === "number"
        ? rawExpires
        : parseInt(rawExpires, GoogleAuthService._RADIX_DECIMAL);
    const expiresInSec = Number.isFinite(parsedExpires)
      ? parsedExpires
      : GoogleAuthService._DEFAULT_EXPIRES_IN_SECONDS;

    this._setToken(response.access_token, expiresInSec);
    if (this._userCallback) {
      this._userCallback(response.access_token);
    }
  }

  private async _fetchRevoke(token: string): Promise<void> {
    try {
      const url = `${GoogleAuthService._REVOKE_ENDPOINT}?token=${encodeURIComponent(token)}`;
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
    } catch {
      // Best-effort network revocation
    }
  }

  private _setToken(token: string, expiresInSeconds: number): void {
    const millisInSecond = 1000;
    this._accessToken = token;
    this._tokenExpiresAt = Date.now() + expiresInSeconds * millisInSecond;
  }

  private _clearToken(): void {
    this._accessToken = null;
    this._tokenExpiresAt = null;
  }
}
