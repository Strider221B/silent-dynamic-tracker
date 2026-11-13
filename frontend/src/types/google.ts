/**
 * Type declarations for Google Identity Services (GIS) OAuth 2.0 Token Client.
 */

export interface ITokenResponse {
  access_token: string;
  expires_in: string | number;
  error?: string;
  error_description?: string;
}

export interface ITokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: ITokenResponse) => void;
  error_callback?: (error: unknown) => void;
}

export interface ITokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
}

export interface IGoogleAccountsOAuth2 {
  initTokenClient: (config: ITokenClientConfig) => ITokenClient;
  revoke?: (token: string, done: () => void) => void;
}

export interface IGoogleAccounts {
  oauth2: IGoogleAccountsOAuth2;
}

export interface IGoogleNamespace {
  accounts: IGoogleAccounts;
}

declare global {
  interface Window {
    google?: IGoogleNamespace;
  }
}
