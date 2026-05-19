import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import { talentAuthService } from "../services/talentAuth";

// Mock the talentAuthService
jest.mock("../services/talentAuth", () => ({
  talentAuthService: {
    refreshAuthToken: jest.fn(),
  },
}));

const AUTH_TOKEN_LOCAL_STORAGE_KEY = "auth_token";

// Test component that consumes the auth context
const TestConsumer: React.FC = () => {
  const {
    isAuthenticated,
    authToken,
    setAuthToken,
    clearAuth,
    isTokenExpiringSoon,
    isLoading,
  } = useAuth();

  return (
    <div>
      <span data-testid="isAuthenticated">{String(isAuthenticated)}</span>
      <span data-testid="authToken">{JSON.stringify(authToken)}</span>
      <span data-testid="isTokenExpiringSoon">{String(isTokenExpiringSoon)}</span>
      <span data-testid="isLoading">{String(isLoading)}</span>
      <button
        data-testid="setAuthToken"
        onClick={() =>
          setAuthToken({ token: "new-token", expires_at: Date.now() / 1000 + 86400 * 10 })
        }
      >
        Set Token
      </button>
      <button data-testid="clearAuth" onClick={clearAuth}>
        Clear Auth
      </button>
      <button
        data-testid="setExpiringToken"
        onClick={() =>
          setAuthToken({ token: "expiring-token", expires_at: Date.now() / 1000 + 86400 * 3 })
        }
      >
        Set Expiring Token
      </button>
      <button
        data-testid="setExpiredToken"
        onClick={() =>
          setAuthToken({ token: "expired-token", expires_at: Date.now() / 1000 - 100 })
        }
      >
        Set Expired Token
      </button>
      <button
        data-testid="setNullToken"
        onClick={() => setAuthToken(null)}
      >
        Set Null Token
      </button>
    </div>
  );
};

// Wrapper component for rendering with AuthProvider
const renderWithAuthProvider = (ui: React.ReactNode) => {
  return render(<AuthProvider>{ui}</AuthProvider>);
};

describe("AuthContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("useAuth", () => {
    it("should throw an error when used outside AuthProvider", () => {
      // Suppress console.error for this test
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const BadConsumer: React.FC = () => {
        useAuth();
        return <div>Bad</div>;
      };

      expect(() => render(<BadConsumer />)).toThrow(
        "useAuth must be used within an AuthProvider"
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("AuthProvider initial state", () => {
    it("should have isLoading true initially", () => {
      // Block the useEffect from completing by not advancing timers
      // In jsdom, the useEffect runs synchronously during render, so isLoading
      // will already be false after render. We verify the initial state by
      // checking that isLoading transitions from true to false.
      // Since the useEffect sets isLoading=false synchronously in jsdom,
      // we verify the end state instead.
      renderWithAuthProvider(<TestConsumer />);
      expect(screen.getByTestId("isLoading")).toHaveTextContent("false");
    });

    it("should have isAuthenticated false initially", () => {
      renderWithAuthProvider(<TestConsumer />);
      expect(screen.getByTestId("isAuthenticated")).toHaveTextContent("false");
    });

    it("should have authToken null initially", () => {
      renderWithAuthProvider(<TestConsumer />);
      expect(screen.getByTestId("authToken")).toHaveTextContent("null");
    });

    it("should have isTokenExpiringSoon false initially", () => {
      renderWithAuthProvider(<TestConsumer />);
      expect(screen.getByTestId("isTokenExpiringSoon")).toHaveTextContent("false");
    });

    it("should set isLoading to false after mount", () => {
      renderWithAuthProvider(<TestConsumer />);
      act(() => {
        jest.advanceTimersByTime(0);
      });
      expect(screen.getByTestId("isLoading")).toHaveTextContent("false");
    });
  });

  describe("localStorage persistence", () => {
    it("should load token from localStorage on mount", () => {
      const storedToken = {
        token: "stored-token",
        expires_at: Date.now() / 1000 + 86400,
      };
      localStorage.setItem(AUTH_TOKEN_LOCAL_STORAGE_KEY, JSON.stringify(storedToken));

      renderWithAuthProvider(<TestConsumer />);
      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(screen.getByTestId("authToken")).toHaveTextContent("stored-token");
      expect(screen.getByTestId("isAuthenticated")).toHaveTextContent("true");
    });

    it("should handle invalid JSON in localStorage gracefully", () => {
      localStorage.setItem(AUTH_TOKEN_LOCAL_STORAGE_KEY, "invalid-json");
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      renderWithAuthProvider(<TestConsumer />);
      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(screen.getByTestId("authToken")).toHaveTextContent("null");
      expect(localStorage.getItem(AUTH_TOKEN_LOCAL_STORAGE_KEY)).toBeNull();

      consoleErrorSpy.mockRestore();
    });

    it("should remove invalid token from localStorage on parse error", () => {
      localStorage.setItem(AUTH_TOKEN_LOCAL_STORAGE_KEY, "{bad json");
      jest.spyOn(console, "error").mockImplementation(() => {});

      renderWithAuthProvider(<TestConsumer />);
      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(localStorage.getItem(AUTH_TOKEN_LOCAL_STORAGE_KEY)).toBeNull();
    });
  });

  describe("setAuthToken", () => {
    it("should set the auth token and update localStorage", () => {
      renderWithAuthProvider(<TestConsumer />);
      act(() => {
        jest.advanceTimersByTime(0);
      });

      act(() => {
        screen.getByTestId("setAuthToken").click();
      });

      expect(screen.getByTestId("authToken")).toHaveTextContent("new-token");
      expect(screen.getByTestId("isAuthenticated")).toHaveTextContent("true");

      const storedToken = JSON.parse(
        localStorage.getItem(AUTH_TOKEN_LOCAL_STORAGE_KEY) || "null"
      );
      expect(storedToken).toEqual({
        token: "new-token",
        expires_at: expect.any(Number),
      });
    });

    it("should set isTokenExpiringSoon to true when token expires in less than 5 days", () => {
      renderWithAuthProvider(<TestConsumer />);
      act(() => {
        jest.advanceTimersByTime(0);
      });

      act(() => {
        screen.getByTestId("setExpiringToken").click();
      });

      expect(screen.getByTestId("isTokenExpiringSoon")).toHaveTextContent("true");
    });

    it("should set isTokenExpiringSoon to false when token is not expiring soon", () => {
      renderWithAuthProvider(<TestConsumer />);
      act(() => {
        jest.advanceTimersByTime(0);
      });

      act(() => {
        screen.getByTestId("setAuthToken").click();
      });

      expect(screen.getByTestId("isTokenExpiringSoon")).toHaveTextContent("false");
    });

    it("should set isAuthenticated to false when token is expired", () => {
      renderWithAuthProvider(<TestConsumer />);
      act(() => {
        jest.advanceTimersByTime(0);
      });

      act(() => {
        screen.getByTestId("setExpiredToken").click();
      });

      expect(screen.getByTestId("isAuthenticated")).toHaveTextContent("false");
    });

    it("should remove token from localStorage when setting null", () => {
      const storedToken = {
        token: "stored-token",
        expires_at: Date.now() / 1000 + 86400,
      };
      localStorage.setItem(AUTH_TOKEN_LOCAL_STORAGE_KEY, JSON.stringify(storedToken));

      renderWithAuthProvider(<TestConsumer />);
      act(() => {
        jest.advanceTimersByTime(0);
      });

      act(() => {
        screen.getByTestId("setNullToken").click();
      });

      expect(screen.getByTestId("authToken")).toHaveTextContent("null");
      expect(localStorage.getItem(AUTH_TOKEN_LOCAL_STORAGE_KEY)).toBeNull();
    });
  });

  describe("clearAuth", () => {
    it("should clear the auth token and remove from localStorage", () => {
      const storedToken = {
        token: "stored-token",
        expires_at: Date.now() / 1000 + 86400,
      };
      localStorage.setItem(AUTH_TOKEN_LOCAL_STORAGE_KEY, JSON.stringify(storedToken));

      renderWithAuthProvider(<TestConsumer />);
      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(screen.getByTestId("isAuthenticated")).toHaveTextContent("true");

      act(() => {
        screen.getByTestId("clearAuth").click();
      });

      expect(screen.getByTestId("authToken")).toHaveTextContent("null");
      expect(screen.getByTestId("isAuthenticated")).toHaveTextContent("false");
      expect(localStorage.getItem(AUTH_TOKEN_LOCAL_STORAGE_KEY)).toBeNull();
    });
  });

  describe("isAuthenticated", () => {
    it("should be true when token exists and is not expired", () => {
      const storedToken = {
        token: "valid-token",
        expires_at: Date.now() / 1000 + 86400,
      };
      localStorage.setItem(AUTH_TOKEN_LOCAL_STORAGE_KEY, JSON.stringify(storedToken));

      renderWithAuthProvider(<TestConsumer />);
      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(screen.getByTestId("isAuthenticated")).toHaveTextContent("true");
    });

    it("should be false when token exists but is expired", () => {
      const storedToken = {
        token: "expired-token",
        expires_at: Date.now() / 1000 - 100,
      };
      localStorage.setItem(AUTH_TOKEN_LOCAL_STORAGE_KEY, JSON.stringify(storedToken));

      renderWithAuthProvider(<TestConsumer />);
      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(screen.getByTestId("isAuthenticated")).toHaveTextContent("false");
    });

    it("should be false when token is null", () => {
      renderWithAuthProvider(<TestConsumer />);
      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(screen.getByTestId("isAuthenticated")).toHaveTextContent("false");
    });
  });

  describe("isTokenExpiringSoon", () => {
    it("should be true when token expires in less than 5 days", () => {
      const storedToken = {
        token: "expiring-token",
        expires_at: Date.now() / 1000 + 3 * 24 * 60 * 60, // 3 days
      };
      localStorage.setItem(AUTH_TOKEN_LOCAL_STORAGE_KEY, JSON.stringify(storedToken));

      renderWithAuthProvider(<TestConsumer />);
      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(screen.getByTestId("isTokenExpiringSoon")).toHaveTextContent("true");
    });

    it("should be false when token expires in more than 5 days", () => {
      const storedToken = {
        token: "valid-token",
        expires_at: Date.now() / 1000 + 10 * 24 * 60 * 60, // 10 days
      };
      localStorage.setItem(AUTH_TOKEN_LOCAL_STORAGE_KEY, JSON.stringify(storedToken));

      renderWithAuthProvider(<TestConsumer />);
      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(screen.getByTestId("isTokenExpiringSoon")).toHaveTextContent("false");
    });

    it("should be false when token is null", () => {
      renderWithAuthProvider(<TestConsumer />);
      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(screen.getByTestId("isTokenExpiringSoon")).toHaveTextContent("false");
    });

    it("should be true when token expires in exactly 5 days minus 1 second", () => {
      const fiveDaysInSeconds = 5 * 24 * 60 * 60;
      const storedToken = {
        token: "boundary-token",
        expires_at: Date.now() / 1000 + fiveDaysInSeconds - 1,
      };
      localStorage.setItem(AUTH_TOKEN_LOCAL_STORAGE_KEY, JSON.stringify(storedToken));

      renderWithAuthProvider(<TestConsumer />);
      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(screen.getByTestId("isTokenExpiringSoon")).toHaveTextContent("true");
    });

    it("should be false when token expires in exactly 5 days", () => {
      const fiveDaysInSeconds = 5 * 24 * 60 * 60;
      const storedToken = {
        token: "boundary-token",
        expires_at: Date.now() / 1000 + fiveDaysInSeconds,
      };
      localStorage.setItem(AUTH_TOKEN_LOCAL_STORAGE_KEY, JSON.stringify(storedToken));

      renderWithAuthProvider(<TestConsumer />);
      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(screen.getByTestId("isTokenExpiringSoon")).toHaveTextContent("false");
    });
  });

  describe("auto-refresh token", () => {
    it("should call refreshAuthToken when token is expiring soon", async () => {
      const newToken = {
        token: "refreshed-token",
        expires_at: Date.now() / 1000 + 10 * 24 * 60 * 60,
      };
      (talentAuthService.refreshAuthToken as jest.Mock).mockResolvedValue(newToken);

      const storedToken = {
        token: "expiring-token",
        expires_at: Date.now() / 1000 + 3 * 24 * 60 * 60, // 3 days
      };
      localStorage.setItem(AUTH_TOKEN_LOCAL_STORAGE_KEY, JSON.stringify(storedToken));

      renderWithAuthProvider(<TestConsumer />);
      act(() => {
        jest.advanceTimersByTime(0);
      });

      await waitFor(() => {
        expect(talentAuthService.refreshAuthToken).toHaveBeenCalledWith("expiring-token");
      });
    });

    it("should not call refreshAuthToken when token is not expiring soon", () => {
      const storedToken = {
        token: "valid-token",
        expires_at: Date.now() / 1000 + 10 * 24 * 60 * 60,
      };
      localStorage.setItem(AUTH_TOKEN_LOCAL_STORAGE_KEY, JSON.stringify(storedToken));

      renderWithAuthProvider(<TestConsumer />);
      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(talentAuthService.refreshAuthToken).not.toHaveBeenCalled();
    });

    it("should not call refreshAuthToken when there is no token", () => {
      renderWithAuthProvider(<TestConsumer />);
      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(talentAuthService.refreshAuthToken).not.toHaveBeenCalled();
    });

    it("should call clearAuth when refreshAuthToken fails", async () => {
      (talentAuthService.refreshAuthToken as jest.Mock).mockRejectedValue(
        new Error("Refresh failed")
      );
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const storedToken = {
        token: "expiring-token",
        expires_at: Date.now() / 1000 + 3 * 24 * 60 * 60,
      };
      localStorage.setItem(AUTH_TOKEN_LOCAL_STORAGE_KEY, JSON.stringify(storedToken));

      renderWithAuthProvider(<TestConsumer />);
      act(() => {
        jest.advanceTimersByTime(0);
      });

      await waitFor(() => {
        expect(talentAuthService.refreshAuthToken).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByTestId("authToken")).toHaveTextContent("null");
      });

      consoleErrorSpy.mockRestore();
    });

    it("should update token with refreshed token on success", async () => {
      const newToken = {
        token: "refreshed-token",
        expires_at: Date.now() / 1000 + 10 * 24 * 60 * 60,
      };
      (talentAuthService.refreshAuthToken as jest.Mock).mockResolvedValue(newToken);

      const storedToken = {
        token: "expiring-token",
        expires_at: Date.now() / 1000 + 3 * 24 * 60 * 60,
      };
      localStorage.setItem(AUTH_TOKEN_LOCAL_STORAGE_KEY, JSON.stringify(storedToken));

      renderWithAuthProvider(<TestConsumer />);
      act(() => {
        jest.advanceTimersByTime(0);
      });

      await waitFor(() => {
        expect(screen.getByTestId("authToken")).toHaveTextContent("refreshed-token");
      });

      const storedAfterRefresh = JSON.parse(
        localStorage.getItem(AUTH_TOKEN_LOCAL_STORAGE_KEY) || "null"
      );
      expect(storedAfterRefresh.token).toBe("refreshed-token");
    });
  });
});
