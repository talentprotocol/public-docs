"use client";

import { useCallback } from "react";
import { useDisconnect } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { clearWalletRelatedStorage } from "../utils/walletStorage";

/**
 * Centralized, robust disconnect that clears:
 * - App auth token (localStorage and context)
 * - Wagmi connection
 * - WalletConnect/AppKit/Web3Modal/wagmi persisted storage
 * - React Query cache related to the user session
 */
export function useFullDisconnect() {
  const { disconnect } = useDisconnect();
  const queryClient = useQueryClient();
  const { clearAuth } = useAuth();

  const fullDisconnect = useCallback(async () => {
    // 1) Clear app auth
    clearAuth();

    // 2) Explicitly disconnect wallet via wagmi
    try {
      disconnect();
    } catch(err) {
      console.warn("Failed to disconnect wallet", err);
    }

    // 3) Clear any persisted wallet/appkit/wc storage keys
    clearWalletRelatedStorage();

    // 4) Reset any cached queries that might contain user-specific data
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
    } catch(err) {
      console.warn("Failed to clear cached queries", err);
    }
  }, [clearAuth, disconnect, queryClient]);

  return { fullDisconnect };
}


