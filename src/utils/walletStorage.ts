"use client";

/**
 * Remove any persisted wallet/session keys from storage (WalletConnect/AppKit/Web3Modal/wagmi).
 * This is intentionally broad: we remove keys that match known prefixes/substrings.
 */
export function clearWalletRelatedStorage(): void {
  if (typeof window === "undefined") return;

  try {
    const localStorageKeysToRemove: string[] = [];
    const sessionStorageKeysToRemove: string[] = [];

    const shouldRemove = (key: string) => {
      const lower = key.toLowerCase();
      return (
        lower.startsWith("wc@2:") ||
        lower.includes("walletconnect") ||
        lower.startsWith("w3m_") ||
        lower.includes("web3modal") ||
        lower.includes("appkit") ||
        lower.includes("reown") ||
        lower.includes("wagmi.recent") ||
        lower.includes("recent_wallet") ||
        lower.includes("recent_connector")
      );
    };

    // Collect first to avoid mutating during iteration across environments
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (shouldRemove(key)) {
        localStorageKeysToRemove.push(key);
      }
    }
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key) continue;
      if (shouldRemove(key)) {
        sessionStorageKeysToRemove.push(key);
      }
    }

    localStorageKeysToRemove.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch(err) {
        console.warn("Failed to clear wallet-related storage", err);
      }
    });
    sessionStorageKeysToRemove.forEach((k) => {
      try {
        sessionStorage.removeItem(k);
      } catch(err) {
        console.warn("Failed to clear wallet-related storage", err);
      }
    });
  } catch (err) {
    // Swallow errors to avoid breaking UX on disconnect
    console.warn("Failed to clear wallet-related storage", err);
  }
}


