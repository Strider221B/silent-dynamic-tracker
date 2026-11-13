import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { GoogleAuthService } from "@/services/GoogleAuthService";

export interface IAuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authService: GoogleAuthService;
  login: () => void;
  logout: () => Promise<void>;
}

export interface IAuthProviderProps {
  children: ReactNode;
  authService?: GoogleAuthService;
}

export const AuthContext = createContext<IAuthContextValue | undefined>(
  undefined,
);

/**
 * Provider component wrapping the Google Identity Services authentication lifecycle.
 */
export function AuthProvider({
  children,
  authService: customService,
}: IAuthProviderProps) {
  const service = useMemo(
    () => customService ?? new GoogleAuthService(),
    [customService],
  );

  const [token, setToken] = useState<string | null>(() =>
    service.getAccessToken(),
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    service.isAuthenticated(),
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const login = useCallback(() => {
    setIsLoading(true);
    try {
      service.requestAccessToken();
    } catch {
      setIsLoading(false);
    }
  }, [service]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await service.revokeToken();
    } finally {
      setToken(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, [service]);

  useEffect(() => {
    service.initClient((newToken: string) => {
      setToken(newToken);
      setIsAuthenticated(true);
      setIsLoading(false);
    });
  }, [service]);

  const contextValue = useMemo<IAuthContextValue>(
    () => ({
      token,
      isAuthenticated,
      isLoading,
      authService: service,
      login,
      logout,
    }),
    [token, isAuthenticated, isLoading, service, login, logout],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export default AuthProvider;

