"use client";

import { base } from "@reown/appkit/networks";
import { useAppKit, useAppKitEvents } from "@reown/appkit/react";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState, useCallback } from "react";
import { useAccount, useSignMessage, useSwitchChain } from "wagmi";
import { talentAuthService } from "../services/talentAuth";
import { useAuth } from "../contexts/AuthContext";
import { useFullDisconnect } from "./useFullDisconnect";
import { SiweMessage } from "siwe";
import { getAddress } from "viem";

const requiredChain = base;

export const useLinkWallet = ({
  onSuccess,
  onEnd,
  store = true
}: {
  onSuccess?: () => void;
  onEnd?: () => void;
  store: boolean;
}) => {
  const { signMessageAsync } = useSignMessage();
  const { switchChain } = useSwitchChain();
  const { address, isConnected, chainId } = useAccount();
  const [status, setStatus] = useState<"idle" | "connecting" | "signing">("idle");
  const [isSigning, setIsSigning] = useState(false);
  const { setAuthToken } = useAuth();

  // Fetch nonce directly when needed (no React Query boilerplate)

  const connectWallets = useMutation({
    mutationFn: async (params: {signature: string, siweMessage: string}) => {
      if (!address || !chainId) {
        throw new Error("Address or chainId not available");
      }
      return await talentAuthService.createAuthToken(address, params.signature, chainId, params.siweMessage);
    }
  });

  const { open } = useAppKit();
  const { data } = useAppKitEvents();
  const { fullDisconnect } = useFullDisconnect();

  const handleConnectWallet = useCallback(async (forceReconnect: boolean = false) => {
    if (!address || forceReconnect) {
      open();
      return;
    }

    if (chainId != requiredChain.id) {
      switchChain({ chainId: requiredChain.id });
    }

    // Set status to signing to trigger the nonce-based message signing effect
    setStatus("signing");
  }, [address, open, chainId, switchChain]);

  // Handle wallet connection events
  useEffect(() => {
    if (data.event === "SELECT_WALLET" && status === "idle") {
      setStatus("connecting");
    } else if (["CONNECT_SUCCESS", "MODAL_CLOSE"].includes(data.event) && status === "connecting" && isConnected) {
      setStatus("signing");
      handleConnectWallet();
    } else if (data.event === "CONNECT_ERROR" && status === "connecting") {
      setStatus("idle");
      console.error("Error connecting wallet");
      if (onEnd) {
        onEnd();
      }
    } else if (data.event === "MODAL_CLOSE" && status !== "signing") {
      setStatus("idle");
      if (onEnd) {
        onEnd();
      }
    }
  }, [data, status, isConnected, onEnd, handleConnectWallet]);

  // Handle message signing when nonce becomes available
  useEffect(() => {
    if (isConnected && address && status === "signing" && store && !isSigning) {
      const signMessage = async () => {
        setIsSigning(true);
        try {
          if (!address) throw new Error("Address is required");
          const resolvedNonce = await talentAuthService.createNonce(address);
          if (!resolvedNonce) throw new Error("Failed to retrieve latest nonce");
          const checksumAddress = getAddress(address);
          const siwe = new SiweMessage({
            domain: window.location.host,
            address: checksumAddress,
            statement: "Sign in with Talent Protocol.",
            uri: window.location.origin,
            version: "1",
            chainId,
            nonce: resolvedNonce,
          });
          const messageString = siwe.prepareMessage();
          const signature = await signMessageAsync({ message: messageString });
          const authToken = await connectWallets.mutateAsync({signature, siweMessage: messageString});
          setAuthToken(authToken);
          setStatus("idle");
          if (onSuccess) {
            onSuccess();
          }
        } catch (error) {
          console.error(error);
          setStatus("idle");
          fullDisconnect();
          if (onEnd) {
            onEnd();
          }
        } finally {
          setIsSigning(false);
        }
      };

      signMessage();
    }
  }, [isConnected, address, status, store, isSigning, signMessageAsync, connectWallets, setAuthToken, onSuccess, onEnd, fullDisconnect, chainId]);

  // Reset signing state when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setIsSigning(false);
      setStatus("idle");
    }
  }, [isConnected]);

  const handleLinkWallet = () => {
    if (!address) {
      open();
    } else {
      fullDisconnect();
      setStatus("signing");
      handleConnectWallet(true);
    }
  };

  return { handleLinkWallet, status };
};
