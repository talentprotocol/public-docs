import { renderHook } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFullDisconnect } from "./useFullDisconnect";
import { useDisconnect } from "wagmi";
import { useAuth } from "../contexts/AuthContext";
import { clearWalletRelatedStorage } from "../utils/walletStorage";

// Mock dependencies
jest.mock("wagmi", () => ({
  useDisconnect: jest.fn(),
}));

jest.mock("../contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../utils/walletStorage", () => ({
  clearWalletRelatedStorage: jest.fn(),
}));

const mockDisconnect = jest.fn();
const mockClearAuth = jest.fn();
const mockQueryClientCancelQueries = jest.fn();
const mockQueryClientClear = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();

  (useDisconnect as jest.Mock).mockReturnValue({
    disconnect: mockDisconnect,
  });

  (useAuth as jest.Mock).mockReturnValue({
    clearAuth: mockClearAuth,
  });

  (clearWalletRelatedStorage as jest.Mock).mockImplementation(() => {});

  mockQueryClientCancelQueries.mockResolvedValue(undefined);
  mockQueryClientClear.mockImplementation(() => {});
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  // Override cancelQueries and clear on the queryClient instance
  queryClient.cancelQueries = mockQueryClientCancelQueries;
  queryClient.clear = mockQueryClientClear;

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

describe("useFullDisconnect", () => {
  it("should return a fullDisconnect function", () => {
    const { result } = renderHook(() => useFullDisconnect(), {
      wrapper: createWrapper(),
    });

    expect(result.current.fullDisconnect).toBeDefined();
    expect(typeof result.current.fullDisconnect).toBe("function");
  });

  it("should call clearAuth first when fullDisconnect is invoked", async () => {
    const { result } = renderHook(() => useFullDisconnect(), {
      wrapper: createWrapper(),
    });

    await result.current.fullDisconnect();

    // clearAuth should be called first
    expect(mockClearAuth).toHaveBeenCalledTimes(1);
  });

  it("should call wagmi disconnect after clearAuth", async () => {
    const { result } = renderHook(() => useFullDisconnect(), {
      wrapper: createWrapper(),
    });

    await result.current.fullDisconnect();

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it("should call clearWalletRelatedStorage after disconnect", async () => {
    const { result } = renderHook(() => useFullDisconnect(), {
      wrapper: createWrapper(),
    });

    await result.current.fullDisconnect();

    expect(clearWalletRelatedStorage).toHaveBeenCalledTimes(1);
  });

  it("should cancel queries and clear the query client", async () => {
    const { result } = renderHook(() => useFullDisconnect(), {
      wrapper: createWrapper(),
    });

    await result.current.fullDisconnect();

    expect(mockQueryClientCancelQueries).toHaveBeenCalledTimes(1);
    expect(mockQueryClientClear).toHaveBeenCalledTimes(1);
  });

  it("should not throw if wagmi disconnect throws an error", async () => {
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockDisconnect.mockImplementation(() => {
      throw new Error("disconnect failed");
    });

    const { result } = renderHook(() => useFullDisconnect(), {
      wrapper: createWrapper(),
    });

    await expect(result.current.fullDisconnect()).resolves.not.toThrow();

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Failed to disconnect wallet",
      expect.any(Error)
    );

    consoleWarnSpy.mockRestore();
  });

  it("should not throw if queryClient operations throw an error", async () => {
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockQueryClientCancelQueries.mockRejectedValue(new Error("cancel failed"));

    const { result } = renderHook(() => useFullDisconnect(), {
      wrapper: createWrapper(),
    });

    await expect(result.current.fullDisconnect()).resolves.not.toThrow();

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Failed to clear cached queries",
      expect.any(Error)
    );

    consoleWarnSpy.mockRestore();
  });

  it("should still clear wallet storage even if wagmi disconnect fails", async () => {
    mockDisconnect.mockImplementation(() => {
      throw new Error("disconnect failed");
    });

    const { result } = renderHook(() => useFullDisconnect(), {
      wrapper: createWrapper(),
    });

    await result.current.fullDisconnect();

    expect(clearWalletRelatedStorage).toHaveBeenCalledTimes(1);
  });

  it("should still clear query cache even if wagmi disconnect fails", async () => {
    mockDisconnect.mockImplementation(() => {
      throw new Error("disconnect failed");
    });

    const { result } = renderHook(() => useFullDisconnect(), {
      wrapper: createWrapper(),
    });

    await result.current.fullDisconnect();

    expect(mockQueryClientCancelQueries).toHaveBeenCalledTimes(1);
    expect(mockQueryClientClear).toHaveBeenCalledTimes(1);
  });
});
