import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { AppKitNetwork, base } from "@reown/appkit/networks";

export const projectId = "fcbc2fe0e488ffe230b366a9cea782ab";

export const networks = [base] as [
  AppKitNetwork,
  ...AppKitNetwork[]
];

// export const networks = [base] as [AppKitNetwork, ...AppKitNetwork[]];

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
