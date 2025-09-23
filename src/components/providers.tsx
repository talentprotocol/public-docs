import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { AppKitProvider, createAppKit } from "@reown/appkit/react";
import { wagmiAdapter, projectId, networks } from "../utils/wagmiUtils";
import { AuthProvider } from "../contexts/AuthContext";
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import { useColorMode } from "@docusaurus/theme-common";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 0,
      staleTime: 2 * 1000
    }
  }
});

const metadata = {
  name: "Talent docs",
  description: "",
  url: "https://docs.talentprotocol.com/",
  icons: ["/images/favicon.ico"]
};

createAppKit({
  allWallets: "SHOW",
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    email: false, // default to true
    socials: false,
    analytics: true // Optional - defaults to your Cloud configuration
  },
  enableWalletConnect: true,
  allowUnsupportedChain: false,
  themeVariables: {
    "--w3m-z-index": 2000
  },
  featuredWalletIds: [
    "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96",
    "fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa"
  ]
});

export function Providers({ children }: { children: React.ReactNode }) {
  const { colorMode } = useColorMode();
  const themeStyle: React.CSSProperties = {
    ["--accent-9" as any]: "var(--ifm-color-primary)",
    ["--accent-10" as any]: "var(--ifm-color-primary-darker)",
    ["--accent-11" as any]: "var(--ifm-color-primary-darkest)",
    ["--accent-contrast" as any]: "#ffffff",
  };
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AppKitProvider
          adapters={[wagmiAdapter]}
          networks={networks}
          projectId={projectId}
        >
          <AuthProvider>
            <Theme appearance={colorMode as any} style={{ backgroundColor: 'transparent', ...themeStyle }}>{children}</Theme>
          </AuthProvider>
        </AppKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
