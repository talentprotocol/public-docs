import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Providers } from "./providers";

// Mock @docusaurus/theme-common
jest.mock("@docusaurus/theme-common", () => ({
  useColorMode: jest.fn(),
}));

// Mock @reown/appkit/react
jest.mock("@reown/appkit/react", () => ({
  createAppKit: jest.fn(),
  AppKitProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="appkit-provider">{children}</div>
  ),
}));

// Mock wagmi
jest.mock("wagmi", () => ({
  WagmiProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="wagmi-provider">{children}</div>
  ),
}));

// Mock @tanstack/react-query
jest.mock("@tanstack/react-query", () => ({
  QueryClient: jest.fn().mockImplementation(() => ({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 0,
        staleTime: 2000,
      },
    },
  })),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="query-client-provider">{children}</div>
  ),
}));

// Mock @radix-ui/themes
jest.mock("@radix-ui/themes", () => ({
  Theme: ({ children, appearance, style }: { children: React.ReactNode; appearance?: string; style?: React.CSSProperties }) => (
    <div data-testid="theme" data-appearance={appearance} style={style}>
      {children}
    </div>
  ),
}));

// Mock ../utils/wagmiUtils
jest.mock("../utils/wagmiUtils", () => ({
  wagmiAdapter: {
    wagmiConfig: { mock: "wagmi-config" },
  },
  projectId: "test-project-id",
  networks: [{ id: "base", name: "Base" }],
}));

// Mock ../contexts/AuthContext
jest.mock("../contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
}));

// Mock @radix-ui/themes/styles.css
jest.mock("@radix-ui/themes/styles.css", () => ({}));

const mockUseColorMode = jest.mocked(require("@docusaurus/theme-common").useColorMode);

describe("Providers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render children", () => {
    mockUseColorMode.mockReturnValue({ colorMode: "light", setLightColorMode: jest.fn(), setDarkColorMode: jest.fn(), setColorMode: jest.fn(), toggleColorMode: jest.fn() });

    render(
      <Providers>
        <div data-testid="child">Test Child</div>
      </Providers>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("should render with WagmiProvider", () => {
    mockUseColorMode.mockReturnValue({ colorMode: "light", setLightColorMode: jest.fn(), setDarkColorMode: jest.fn(), setColorMode: jest.fn(), toggleColorMode: jest.fn() });

    render(
      <Providers>
        <div data-testid="child">Test Child</div>
      </Providers>
    );

    expect(screen.getByTestId("wagmi-provider")).toBeInTheDocument();
  });

  it("should render with QueryClientProvider", () => {
    mockUseColorMode.mockReturnValue({ colorMode: "light", setLightColorMode: jest.fn(), setDarkColorMode: jest.fn(), setColorMode: jest.fn(), toggleColorMode: jest.fn() });

    render(
      <Providers>
        <div data-testid="child">Test Child</div>
      </Providers>
    );

    expect(screen.getByTestId("query-client-provider")).toBeInTheDocument();
  });

  it("should render with AppKitProvider", () => {
    mockUseColorMode.mockReturnValue({ colorMode: "light", setLightColorMode: jest.fn(), setDarkColorMode: jest.fn(), setColorMode: jest.fn(), toggleColorMode: jest.fn() });

    render(
      <Providers>
        <div data-testid="child">Test Child</div>
      </Providers>
    );

    expect(screen.getByTestId("appkit-provider")).toBeInTheDocument();
  });

  it("should render with AuthProvider", () => {
    mockUseColorMode.mockReturnValue({ colorMode: "light", setLightColorMode: jest.fn(), setDarkColorMode: jest.fn(), setColorMode: jest.fn(), toggleColorMode: jest.fn() });

    render(
      <Providers>
        <div data-testid="child">Test Child</div>
      </Providers>
    );

    expect(screen.getByTestId("auth-provider")).toBeInTheDocument();
  });

  it("should render with Theme", () => {
    mockUseColorMode.mockReturnValue({ colorMode: "light", setLightColorMode: jest.fn(), setDarkColorMode: jest.fn(), setColorMode: jest.fn(), toggleColorMode: jest.fn() });

    render(
      <Providers>
        <div data-testid="child">Test Child</div>
      </Providers>
    );

    expect(screen.getByTestId("theme")).toBeInTheDocument();
  });

  it("should pass light colorMode to Theme", () => {
    mockUseColorMode.mockReturnValue({ colorMode: "light", setLightColorMode: jest.fn(), setDarkColorMode: jest.fn(), setColorMode: jest.fn(), toggleColorMode: jest.fn() });

    render(
      <Providers>
        <div data-testid="child">Test Child</div>
      </Providers>
    );

    expect(screen.getByTestId("theme")).toHaveAttribute("data-appearance", "light");
  });

  it("should pass dark colorMode to Theme", () => {
    mockUseColorMode.mockReturnValue({ colorMode: "dark", setLightColorMode: jest.fn(), setDarkColorMode: jest.fn(), setColorMode: jest.fn(), toggleColorMode: jest.fn() });

    render(
      <Providers>
        <div data-testid="child">Test Child</div>
      </Providers>
    );

    expect(screen.getByTestId("theme")).toHaveAttribute("data-appearance", "dark");
  });

  it("should apply theme style with transparent background", () => {
    mockUseColorMode.mockReturnValue({ colorMode: "light", setLightColorMode: jest.fn(), setDarkColorMode: jest.fn(), setColorMode: jest.fn(), toggleColorMode: jest.fn() });

    render(
      <Providers>
        <div data-testid="child">Test Child</div>
      </Providers>
    );

    const theme = screen.getByTestId("theme");
    expect(theme.style.backgroundColor).toBe("transparent");
  });

  it("should apply custom accent CSS variables", () => {
    mockUseColorMode.mockReturnValue({ colorMode: "light", setLightColorMode: jest.fn(), setDarkColorMode: jest.fn(), setColorMode: jest.fn(), toggleColorMode: jest.fn() });

    render(
      <Providers>
        <div data-testid="child">Test Child</div>
      </Providers>
    );

    const theme = screen.getByTestId("theme");
    const style = theme.getAttribute("style");
    expect(style).toContain("--accent-9");
    expect(style).toContain("--accent-10");
    expect(style).toContain("--accent-11");
    expect(style).toContain("--accent-contrast");
  });

  it("should nest providers in the correct order", () => {
    mockUseColorMode.mockReturnValue({ colorMode: "light", setLightColorMode: jest.fn(), setDarkColorMode: jest.fn(), setColorMode: jest.fn(), toggleColorMode: jest.fn() });

    render(
      <Providers>
        <div data-testid="child">Test Child</div>
      </Providers>
    );

    const wagmiProvider = screen.getByTestId("wagmi-provider");
    const queryClientProvider = screen.getByTestId("query-client-provider");
    const appkitProvider = screen.getByTestId("appkit-provider");
    const authProvider = screen.getByTestId("auth-provider");
    const theme = screen.getByTestId("theme");
    const child = screen.getByTestId("child");

    // WagmiProvider should contain QueryClientProvider
    expect(wagmiProvider).toContainElement(queryClientProvider);
    // QueryClientProvider should contain AppKitProvider
    expect(queryClientProvider).toContainElement(appkitProvider);
    // AppKitProvider should contain AuthProvider
    expect(appkitProvider).toContainElement(authProvider);
    // AuthProvider should contain Theme
    expect(authProvider).toContainElement(theme);
    // Theme should contain the child
    expect(theme).toContainElement(child);
  });
});
