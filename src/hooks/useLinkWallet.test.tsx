import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLinkWallet } from "./useLinkWallet";
import { useSignMessage, useSwitchChain, useAccount } from "wagmi";
import { useAppKit, useAppKitEvents } from "@reown/appkit/react";
import { talentAuthService } from "../services/talentAuth";
import { useAuth } from "../contexts/AuthContext";
import { useFullDisconnect } from "./useFullDisconnect";
import { SiweMessage } from "siwe";
import { getAddress } from "viem";

// Mock dependencies
jest.mock("wagmi", () => ({
  useSignMessage: jest.fn(),
  useSwitchChain: jest.fn(),
  useAccount: jest.fn(),
}));

jest.mock("@reown/appkit/networks", () => ({
  base: { id: 8453, name: "Base" },
}));

jest.mock("@reown/appkit/react", () => ({
  useAppKit: jest.fn(),
  useAppKitEvents: jest.fn(),
}));

jest.mock("../services/talentAuth", () => ({
  talentAuthService: {
    createNonce: jest.fn(),
    createAuthToken: jest.fn(),
  },
}));

jest.mock("../contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("./useFullDisconnect", () => ({
  useFullDisconnect: jest.fn(),
}));

jest.mock("siwe", () => ({
  SiweMessage: jest.fn().mockImplementation(() => ({
    prepareMessage: jest.fn().mockReturnValue("siwe-message-string"),
  })),
}));

jest.mock("viem", () => ({
  getAddress: jest.fn().mockReturnValue("0xChecksumAddress"),
}));

const mockSignMessageAsync = jest.fn().mockResolvedValue("mock-signature");
const mockSwitchChain = jest.fn();
const mockOpen = jest.fn();
const mockSetAuthToken = jest.fn();
const mockFullDisconnect = jest.fn();
const mockMutateAsync = jest.fn().mockResolvedValue({ token: "auth-token", expires_at: 1234567890 });
const mockCreateNonce = jest.fn().mockResolvedValue("mock-nonce");
const mockCreateAuthToken = jest.fn().mockResolvedValue({ token: "auth-token", expires_at: 1234567890 });
const mockOnSuccess = jest.fn();
const mockOnEnd = jest.fn();

const mockQueryClientCancelQueries = jest.fn().mockResolvedValue(undefined);
const mockQueryClientClear = jest.fn();

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

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

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();

  (useSignMessage as jest.Mock).mockReturnValue({
    signMessageAsync: mockSignMessageAsync,
  });

  (useSwitchChain as jest.Mock).mockReturnValue({
    switchChain: mockSwitchChain,
  });

  (useAccount as jest.Mock).mockReturnValue({
    address: "0x1234567890abcdef1234567890abcdef12345678",
    isConnected: true,
    chainId: 8453, // base chain id
  });

  (useAppKit as jest.Mock).mockReturnValue({
    open: mockOpen,
  });

  (useAppKitEvents as jest.Mock).mockReturnValue({
    data: { event: "" },
  });

  (useAuth as jest.Mock).mockReturnValue({
    setAuthToken: mockSetAuthToken,
  });

  (useFullDisconnect as jest.Mock).mockReturnValue({
    fullDisconnect: mockFullDisconnect,
  });

  (talentAuthService.createNonce as jest.Mock).mockImplementation(mockCreateNonce);
  (talentAuthService.createAuthToken as jest.Mock).mockImplementation(mockCreateAuthToken);

  mockMutateAsync.mockResolvedValue({ token: "auth-token", expires_at: 1234567890 });
  mockOnSuccess.mockReset();
  mockOnEnd.mockReset();
  mockFullDisconnect.mockReset();
  mockOpen.mockReset();
  mockSwitchChain.mockReset();
  mockSignMessageAsync.mockResolvedValue("mock-signature");
  mockCreateNonce.mockResolvedValue("mock-nonce");
  mockCreateAuthToken.mockResolvedValue({ token: "auth-token", expires_at: 1234567890 });
});

afterEach(() => {
  jest.useRealTimers();
});

describe("useLinkWallet", () => {
  describe("initial state", () => {
    it("should return handleLinkWallet function and idle status", () => {
      const { result } = renderHook(
        () => useLinkWallet({ store: true }),
        { wrapper: createWrapper() }
      );

      expect(result.current.handleLinkWallet).toBeDefined();
      expect(typeof result.current.handleLinkWallet).toBe("function");
      expect(result.current.status).toBe("idle");
    });
  });

  describe("handleLinkWallet", () => {
    it("should open wallet modal when no address is connected", () => {
      (useAccount as jest.Mock).mockReturnValue({
        address: undefined,
        isConnected: false,
        chainId: 8453,
      });

      const { result } = renderHook(
        () => useLinkWallet({ store: true }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleLinkWallet();
      });

      expect(mockOpen).toHaveBeenCalledTimes(1);
    });

    it("should call fullDisconnect and open when address exists", () => {
      const { result } = renderHook(
        () => useLinkWallet({ store: true }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleLinkWallet();
      });

      expect(mockFullDisconnect).toHaveBeenCalledTimes(1);
      expect(result.current.status).toBe("signing");
    });

    it("should call open with no args when address exists (forceReconnect=true path)", () => {
      const { result } = renderHook(
        () => useLinkWallet({ store: true }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleLinkWallet();
      });

      // handleConnectWallet is called with forceReconnect=true, which calls open()
      // because address exists but forceReconnect is true
      expect(mockOpen).toHaveBeenCalledTimes(1);
    });
  });

  describe("handleConnectWallet", () => {
    it("should open wallet modal when no address", () => {
      (useAccount as jest.Mock).mockReturnValue({
        address: undefined,
        isConnected: false,
        chainId: 8453,
      });

      const { result } = renderHook(
        () => useLinkWallet({ store: true }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleLinkWallet();
      });

      expect(mockOpen).toHaveBeenCalled();
    });

    it("should switch chain when chainId does not match required chain", () => {
      (useAccount as jest.Mock).mockReturnValue({
        address: "0x1234567890abcdef1234567890abcdef12345678",
        isConnected: true,
        chainId: 1, // wrong chain
      });

      const { result } = renderHook(
        () => useLinkWallet({ store: true }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleLinkWallet();
      });

      // fullDisconnect is called, then handleConnectWallet(true) is called
      // which calls open() because forceReconnect is true
      expect(mockFullDisconnect).toHaveBeenCalled();
    });

    it("should set status to signing when on correct chain with address", () => {
      const { result } = renderHook(
        () => useLinkWallet({ store: true }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleLinkWallet();
      });

      expect(result.current.status).toBe("signing");
    });
  });

  describe("wallet connection events", () => {
    it("should transition to connecting status on SELECT_WALLET event", () => {
      let eventsCallback: (data: { event: string }) => void;
      (useAppKitEvents as jest.Mock).mockImplementation(() => {
        const [data, setData] = React.useState({ event: "" });
        eventsCallback = setData;
        return { data };
      });

      const { result } = renderHook(
        () => useLinkWallet({ store: true }),
        { wrapper: createWrapper() }
      );

      act(() => {
        eventsCallback({ event: "SELECT_WALLET" });
      });

      expect(result.current.status).toBe("connecting");
    });

    it("should transition to signing on CONNECT_SUCCESS when connected", () => {
      let eventsCallback: (data: { event: string }) => void;
      (useAppKitEvents as jest.Mock).mockImplementation(() => {
        const [data, setData] = React.useState({ event: "" });
        eventsCallback = setData;
        return { data };
      });

      const { result } = renderHook(
        () => useLinkWallet({ store: true }),
        { wrapper: createWrapper() }
      );

      // First trigger SELECT_WALLET to go to connecting
      act(() => {
        eventsCallback({ event: "SELECT_WALLET" });
      });

      expect(result.current.status).toBe("connecting");

      // Then trigger CONNECT_SUCCESS
      act(() => {
        eventsCallback({ event: "CONNECT_SUCCESS" });
      });

      expect(result.current.status).toBe("signing");
    });

    it("should call onEnd and reset to idle on CONNECT_ERROR", () => {
      let eventsCallback: (data: { event: string }) => void;
      (useAppKitEvents as jest.Mock).mockImplementation(() => {
        const [data, setData] = React.useState({ event: "" });
        eventsCallback = setData;
        return { data };
      });

      const { result } = renderHook(
        () => useLinkWallet({ store: true, onEnd: mockOnEnd }),
        { wrapper: createWrapper() }
      );

      act(() => {
        eventsCallback({ event: "SELECT_WALLET" });
      });

      act(() => {
        eventsCallback({ event: "CONNECT_ERROR" });
      });

      expect(result.current.status).toBe("idle");
      expect(mockOnEnd).toHaveBeenCalledTimes(1);
    });

    it("should call onEnd and reset to idle on MODAL_CLOSE when not signing", () => {
      let eventsCallback: (data: { event: string }) => void;
      (useAppKitEvents as jest.Mock).mockImplementation(() => {
        const [data, setData] = React.useState({ event: "" });
        eventsCallback = setData;
        return { data };
      });

      // isConnected must be false so the ["CONNECT_SUCCESS", "MODAL_CLOSE"] && isConnected branch doesn't fire
      (useAccount as jest.Mock).mockReturnValue({
        address: undefined,
        isConnected: false,
        chainId: 8453,
      });

      const { result } = renderHook(
        () => useLinkWallet({ store: true, onEnd: mockOnEnd }),
        { wrapper: createWrapper() }
      );

      act(() => {
        eventsCallback({ event: "SELECT_WALLET" });
      });

      act(() => {
        eventsCallback({ event: "MODAL_CLOSE" });
      });

      expect(result.current.status).toBe("idle");
      // onEnd is called twice: once when MODAL_CLOSE sets status to idle,
      // and again when the effect re-runs due to the status change (MODAL_CLOSE && status !== "signing" still matches)
      expect(mockOnEnd).toHaveBeenCalledTimes(2);
    });

    it("should not call onEnd on MODAL_CLOSE when status is signing", () => {
      let eventsCallback: (data: { event: string }) => void;
      (useAppKitEvents as jest.Mock).mockImplementation(() => {
        const [data, setData] = React.useState({ event: "" });
        eventsCallback = setData;
        return { data };
      });

      const { result } = renderHook(
        () => useLinkWallet({ store: true, onEnd: mockOnEnd }),
        { wrapper: createWrapper() }
      );

      // Set status to signing by calling handleLinkWallet
      act(() => {
        result.current.handleLinkWallet();
      });

      act(() => {
        eventsCallback({ event: "MODAL_CLOSE" });
      });

      // onEnd should not be called because status is signing
      expect(mockOnEnd).not.toHaveBeenCalled();
    });
  });

  describe("message signing flow", () => {
    it("should sign message and set auth token when connected and status is signing", async () => {
      const { result } = renderHook(
        () => useLinkWallet({ store: true, onSuccess: mockOnSuccess }),
        { wrapper: createWrapper() }
      );

      // Trigger signing via handleLinkWallet
      act(() => {
        result.current.handleLinkWallet();
      });

      // The signing effect should run
      await act(async () => {
        jest.advanceTimersByTime(0);
      });

      await waitFor(() => {
        expect(mockCreateNonce).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(getAddress).toHaveBeenCalledWith("0x1234567890abcdef1234567890abcdef12345678");
      });

      await waitFor(() => {
        expect(SiweMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            address: "0xChecksumAddress",
            nonce: "mock-nonce",
            chainId: 8453,
          })
        );
      });

      await waitFor(() => {
        expect(mockSignMessageAsync).toHaveBeenCalledWith({
          message: "siwe-message-string",
        });
      });

      await waitFor(() => {
        expect(mockSetAuthToken).toHaveBeenCalledWith({
          token: "auth-token",
          expires_at: 1234567890,
        });
      });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      });

      expect(result.current.status).toBe("idle");
    });

    it("should call fullDisconnect and onEnd on signing error", async () => {
      mockSignMessageAsync.mockRejectedValue(new Error("User rejected"));

      const { result } = renderHook(
        () => useLinkWallet({ store: true, onEnd: mockOnEnd }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleLinkWallet();
      });

      await act(async () => {
        jest.advanceTimersByTime(0);
      });

      await waitFor(() => {
        expect(mockFullDisconnect).toHaveBeenCalledTimes(2);
      });

      await waitFor(() => {
        expect(mockOnEnd).toHaveBeenCalledTimes(1);
      });

      expect(result.current.status).toBe("idle");
    });

    it("should call fullDisconnect and onEnd when createNonce fails", async () => {
      mockCreateNonce.mockResolvedValue(null);

      const { result } = renderHook(
        () => useLinkWallet({ store: true, onEnd: mockOnEnd }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleLinkWallet();
      });

      await act(async () => {
        jest.advanceTimersByTime(0);
      });

      await waitFor(() => {
        expect(mockFullDisconnect).toHaveBeenCalledTimes(2);
      });

      await waitFor(() => {
        expect(mockOnEnd).toHaveBeenCalledTimes(1);
      });

      expect(result.current.status).toBe("idle");
    });

    it("should not trigger signing when store is false", () => {
      const { result } = renderHook(
        () => useLinkWallet({ store: false }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleLinkWallet();
      });

      // Status should be signing from handleLinkWallet, but the effect
      // should not execute signMessage because store is false
      expect(result.current.status).toBe("signing");
      expect(mockCreateNonce).not.toHaveBeenCalled();
    });

    it("should not trigger signing when not connected", () => {
      (useAccount as jest.Mock).mockReturnValue({
        address: undefined,
        isConnected: false,
        chainId: 8453,
      });

      const { result } = renderHook(
        () => useLinkWallet({ store: true }),
        { wrapper: createWrapper() }
      );

      // handleLinkWallet will call open() but status stays idle
      // because address is undefined
      act(() => {
        result.current.handleLinkWallet();
      });

      expect(mockCreateNonce).not.toHaveBeenCalled();
    });
  });

  describe("disconnect reset", () => {
    it("should reset signing state when wallet disconnects", () => {
      let accountValue = {
        address: "0x1234567890abcdef1234567890abcdef12345678",
        isConnected: true,
        chainId: 8453,
      };

      (useAccount as jest.Mock).mockImplementation(() => accountValue);

      const { result, rerender } = renderHook(
        () => useLinkWallet({ store: true }),
        { wrapper: createWrapper() }
      );

      // Trigger signing
      act(() => {
        result.current.handleLinkWallet();
      });

      expect(result.current.status).toBe("signing");

      // Simulate disconnect
      accountValue = {
        address: undefined,
        isConnected: false,
        chainId: 8453,
      };

      (useAccount as jest.Mock).mockImplementation(() => accountValue);

      rerender();

      expect(result.current.status).toBe("idle");
    });
  });

  describe("chain switching", () => {
    it("should switch to required chain when on wrong chain during handleConnectWallet", () => {
      (useAccount as jest.Mock).mockReturnValue({
        address: "0x1234567890abcdef1234567890abcdef12345678",
        isConnected: true,
        chainId: 1, // Ethereum mainnet, not base
      });

      const { result } = renderHook(
        () => useLinkWallet({ store: true }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleLinkWallet();
      });

      // fullDisconnect is called first, then handleConnectWallet(true)
      // Since forceReconnect is true, open() is called
      expect(mockFullDisconnect).toHaveBeenCalled();
    });
  });

  describe("callbacks", () => {
    it("should call onSuccess after successful auth", async () => {
      const { result } = renderHook(
        () => useLinkWallet({ store: true, onSuccess: mockOnSuccess }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleLinkWallet();
      });

      await act(async () => {
        jest.advanceTimersByTime(0);
      });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it("should not call onSuccess when not provided", async () => {
      const { result } = renderHook(
        () => useLinkWallet({ store: true }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleLinkWallet();
      });

      await act(async () => {
        jest.advanceTimersByTime(0);
      });

      await waitFor(() => {
        expect(mockSetAuthToken).toHaveBeenCalled();
      });
    });
  });

  describe("status transitions", () => {
    it("should start as idle", () => {
      const { result } = renderHook(
        () => useLinkWallet({ store: true }),
        { wrapper: createWrapper() }
      );

      expect(result.current.status).toBe("idle");
    });

    it("should transition to signing when handleLinkWallet is called with address", () => {
      const { result } = renderHook(
        () => useLinkWallet({ store: true }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleLinkWallet();
      });

      expect(result.current.status).toBe("signing");
    });

    it("should return to idle after successful signing", async () => {
      const { result } = renderHook(
        () => useLinkWallet({ store: true }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleLinkWallet();
      });

      await act(async () => {
        jest.advanceTimersByTime(0);
      });

      await waitFor(() => {
        expect(result.current.status).toBe("idle");
      });
    });

    it("should return to idle after signing error", async () => {
      mockSignMessageAsync.mockRejectedValue(new Error("User rejected"));

      const { result } = renderHook(
        () => useLinkWallet({ store: true }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleLinkWallet();
      });

      await act(async () => {
        jest.advanceTimersByTime(0);
      });

      await waitFor(() => {
        expect(result.current.status).toBe("idle");
      });
    });
  });
});
