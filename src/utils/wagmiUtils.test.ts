/// <reference types="jest" />
jest.mock("@reown/appkit-adapter-wagmi", () => {
  const mockWagmiConfig = { chains: ["base"] };
  const MockWagmiAdapter = jest.fn().mockImplementation(function (this: { wagmiConfig: typeof mockWagmiConfig }) {
    this.wagmiConfig = mockWagmiConfig;
  });
  return {
    WagmiAdapter: MockWagmiAdapter,
  };
});

jest.mock("@reown/appkit/networks", () => ({
  base: { id: 8453, name: "Base" },
  AppKitNetwork: undefined,
}));

import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { base } from "@reown/appkit/networks";
import { projectId, networks, wagmiAdapter, wagmiConfig } from "./wagmiUtils";

describe("wagmiUtils", () => {
  describe("projectId", () => {
    it("should be defined", () => {
      expect(projectId).toBeDefined();
    });

    it("should be a non-empty string", () => {
      expect(typeof projectId).toBe("string");
      expect(projectId.length).toBeGreaterThan(0);
    });

    it("should match the expected project ID", () => {
      expect(projectId).toBe("fcbc2fe0e488ffe230b366a9cea782ab");
    });
  });

  describe("networks", () => {
    it("should be defined", () => {
      expect(networks).toBeDefined();
    });

    it("should be an array", () => {
      expect(Array.isArray(networks)).toBe(true);
    });

    it("should contain at least one network", () => {
      expect(networks.length).toBeGreaterThanOrEqual(1);
    });

    it("should include the base network", () => {
      expect(networks).toContainEqual(base);
    });

    it("should have networks with required properties", () => {
      networks.forEach((network) => {
        expect(network).toHaveProperty("id");
        expect(network).toHaveProperty("name");
      });
    });
  });

  describe("wagmiAdapter", () => {
    it("should be defined", () => {
      expect(wagmiAdapter).toBeDefined();
    });

    it("should be an instance of WagmiAdapter", () => {
      expect(wagmiAdapter).toBeInstanceOf(WagmiAdapter);
    });

    it("should have a wagmiConfig property", () => {
      expect(wagmiAdapter.wagmiConfig).toBeDefined();
    });

    it("should be initialized with correct networks and projectId", () => {
      expect(WagmiAdapter).toHaveBeenCalledWith({
        networks,
        projectId,
      });
    });
  });

  describe("wagmiConfig", () => {
    it("should be defined", () => {
      expect(wagmiConfig).toBeDefined();
    });

    it("should match wagmiAdapter.wagmiConfig", () => {
      expect(wagmiConfig).toBe(wagmiAdapter.wagmiConfig);
    });
  });
});
