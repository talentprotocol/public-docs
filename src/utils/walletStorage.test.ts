/// <reference types="jest" />
import { clearWalletRelatedStorage } from "./walletStorage";

describe("clearWalletRelatedStorage", () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should remove keys starting with 'wc@2:'", () => {
    localStorage.setItem("wc@2:xyz", "value");
    localStorage.setItem("wc@2:abc", "value");
    localStorage.setItem("other_key", "value");
    clearWalletRelatedStorage();
    expect(localStorage.getItem("wc@2:xyz")).toBeNull();
    expect(localStorage.getItem("wc@2:abc")).toBeNull();
    expect(localStorage.getItem("other_key")).toBe("value");
  });

  it("should remove keys containing 'walletconnect' (case-insensitive)", () => {
    localStorage.setItem("walletconnect_data", "value");
    localStorage.setItem("WALLETCONNECT_session", "value");
    localStorage.setItem("my_walletconnect_key", "value");
    localStorage.setItem("safe_key", "value");
    clearWalletRelatedStorage();
    expect(localStorage.getItem("walletconnect_data")).toBeNull();
    expect(localStorage.getItem("WALLETCONNECT_session")).toBeNull();
    expect(localStorage.getItem("my_walletconnect_key")).toBeNull();
    expect(localStorage.getItem("safe_key")).toBe("value");
  });

  it("should remove keys starting with 'w3m_' (case-insensitive)", () => {
    localStorage.setItem("w3m_connected", "value");
    localStorage.setItem("w3m_modal", "value");
    localStorage.setItem("w3m_other", "value");
    clearWalletRelatedStorage();
    expect(localStorage.getItem("w3m_connected")).toBeNull();
    expect(localStorage.getItem("w3m_modal")).toBeNull();
    expect(localStorage.getItem("w3m_other")).toBeNull();
  });

  it("should remove keys containing 'web3modal' (case-insensitive)", () => {
    localStorage.setItem("web3modal_state", "value");
    localStorage.setItem("Web3Modal_config", "value");
    localStorage.setItem("no_match", "value");
    clearWalletRelatedStorage();
    expect(localStorage.getItem("web3modal_state")).toBeNull();
    expect(localStorage.getItem("Web3Modal_config")).toBeNull();
    expect(localStorage.getItem("no_match")).toBe("value");
  });

  it("should remove keys containing 'appkit' (case-insensitive)", () => {
    localStorage.setItem("appkit_provider", "value");
    localStorage.setItem("AppKit_state", "value");
    localStorage.setItem("random_key", "value");
    clearWalletRelatedStorage();
    expect(localStorage.getItem("appkit_provider")).toBeNull();
    expect(localStorage.getItem("AppKit_state")).toBeNull();
    expect(localStorage.getItem("random_key")).toBe("value");
  });

  it("should remove keys containing 'reown' (case-insensitive)", () => {
    localStorage.setItem("reown_connector", "value");
    localStorage.setItem("Reown_session", "value");
    localStorage.setItem("unrelated", "value");
    clearWalletRelatedStorage();
    expect(localStorage.getItem("reown_connector")).toBeNull();
    expect(localStorage.getItem("Reown_session")).toBeNull();
    expect(localStorage.getItem("unrelated")).toBe("value");
  });

  it("should remove keys containing 'wagmi.recent' (case-insensitive)", () => {
    localStorage.setItem("wagmi.recent_connector", "value");
    localStorage.setItem("WAGMI.RECENT_wallet", "value");
    localStorage.setItem("wagmi_other", "value");
    clearWalletRelatedStorage();
    expect(localStorage.getItem("wagmi.recent_connector")).toBeNull();
    expect(localStorage.getItem("WAGMI.RECENT_wallet")).toBeNull();
    expect(localStorage.getItem("wagmi_other")).toBe("value");
  });

  it("should remove keys containing 'recent_wallet' (case-insensitive)", () => {
    localStorage.setItem("recent_wallet_id", "value");
    localStorage.setItem("RECENT_WALLET_data", "value");
    localStorage.setItem("wallet_list", "value");
    clearWalletRelatedStorage();
    expect(localStorage.getItem("recent_wallet_id")).toBeNull();
    expect(localStorage.getItem("RECENT_WALLET_data")).toBeNull();
    expect(localStorage.getItem("wallet_list")).toBe("value");
  });

  it("should remove keys containing 'recent_connector' (case-insensitive)", () => {
    localStorage.setItem("recent_connector_id", "value");
    localStorage.setItem("RECENT_CONNECTOR_info", "value");
    localStorage.setItem("connector_list", "value");
    clearWalletRelatedStorage();
    expect(localStorage.getItem("recent_connector_id")).toBeNull();
    expect(localStorage.getItem("RECENT_CONNECTOR_info")).toBeNull();
    expect(localStorage.getItem("connector_list")).toBe("value");
  });

  it("should remove matching keys from sessionStorage", () => {
    sessionStorage.setItem("wc@2:session", "value");
    sessionStorage.setItem("walletconnect_data", "value");
    sessionStorage.setItem("w3m_state", "value");
    sessionStorage.setItem("safe_session", "value");
    clearWalletRelatedStorage();
    expect(sessionStorage.getItem("wc@2:session")).toBeNull();
    expect(sessionStorage.getItem("walletconnect_data")).toBeNull();
    expect(sessionStorage.getItem("w3m_state")).toBeNull();
    expect(sessionStorage.getItem("safe_session")).toBe("value");
  });

  it("should not remove non-matching keys", () => {
    localStorage.setItem("user_preferences", "value");
    localStorage.setItem("theme", "value");
    localStorage.setItem("language", "value");
    localStorage.setItem("app_data", "value");
    clearWalletRelatedStorage();
    expect(localStorage.getItem("user_preferences")).toBe("value");
    expect(localStorage.getItem("theme")).toBe("value");
    expect(localStorage.getItem("language")).toBe("value");
    expect(localStorage.getItem("app_data")).toBe("value");
  });

  it("should handle empty storage", () => {
    expect(() => clearWalletRelatedStorage()).not.toThrow();
  });

  it("should handle errors during removeItem gracefully", () => {
    localStorage.setItem("wc@2:error_key", "value");
    const originalRemove = localStorage.removeItem.bind(localStorage);
    jest.spyOn(Storage.prototype, "removeItem").mockImplementation(function (this: Storage, key: string) {
      if (key === "wc@2:error_key") {
        throw new Error("Storage error");
      }
      return originalRemove.call(this, key);
    });
    clearWalletRelatedStorage();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Failed to clear wallet-related storage",
      expect.any(Error)
    );
  });

  it("should handle errors during storage access gracefully", () => {
    jest.spyOn(Storage.prototype, "length", "get").mockImplementation(() => {
      throw new Error("Access denied");
    });
    clearWalletRelatedStorage();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Failed to clear wallet-related storage",
      expect.any(Error)
    );
  });

  it("should handle mixed localStorage and sessionStorage keys", () => {
    localStorage.setItem("wc@2:local", "value");
    localStorage.setItem("appkit_local", "value");
    sessionStorage.setItem("wc@2:session", "value");
    sessionStorage.setItem("web3modal_session", "value");
    clearWalletRelatedStorage();
    expect(localStorage.getItem("wc@2:local")).toBeNull();
    expect(localStorage.getItem("appkit_local")).toBeNull();
    expect(sessionStorage.getItem("wc@2:session")).toBeNull();
    expect(sessionStorage.getItem("web3modal_session")).toBeNull();
  });

  it("should handle case-insensitive matching for all patterns", () => {
    localStorage.setItem("WC@2:UPPER", "value");
    localStorage.setItem("WalletConnect_mixed", "value");
    localStorage.setItem("W3M_upper", "value");
    localStorage.setItem("Web3Modal_mixed", "value");
    localStorage.setItem("APPKIT_upper", "value");
    localStorage.setItem("REOWN_upper", "value");
    localStorage.setItem("WAGMI.RECENT_upper", "value");
    localStorage.setItem("RECENT_WALLET_upper", "value");
    localStorage.setItem("RECENT_CONNECTOR_upper", "value");
    clearWalletRelatedStorage();
    expect(localStorage.length).toBe(0);
  });
});
