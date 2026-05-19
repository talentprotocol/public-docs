import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ApiKeysManager from './index';

// ─── Mock Providers as a simple pass-through ─────────────────────────────────
jest.mock('../providers', () => ({
  Providers: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ─── Mock @radix-ui/themes ───────────────────────────────────────────────────
jest.mock('@radix-ui/themes', () => ({
  Theme: ({ children, appearance, style }: { children: React.ReactNode; appearance?: string; style?: React.CSSProperties }) => (
    <div data-testid="theme" data-appearance={appearance} style={style}>
      {children}
    </div>
  ),
  Button: ({ children, onClick, disabled, variant, color, size, title, className }: any) => (
    <button
      data-testid="button"
      data-variant={variant}
      data-color={color}
      data-disabled={disabled}
      data-title={title}
      className={className}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  ),
  IconButton: ({ children, onClick, disabled, variant, size, color, 'aria-label': ariaLabel }: any) => (
    <button
      data-testid="icon-button"
      data-variant={variant}
      data-color={color}
      data-disabled={disabled}
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  ),
  Card: ({ children, variant, size, style }: any) => (
    <div data-testid="card" data-variant={variant} data-size={size} style={style}>
      {children}
    </div>
  ),
  Text: ({ children, as, size, weight, color, style, className }: any) => {
    const Tag = as || 'span';
    return <Tag data-testid="text" data-size={size} data-color={color} style={style} className={className}>{children}</Tag>;
  },
  Flex: ({ children, direction, align, justify, mb, gap }: any) => (
    <div data-testid="flex" data-direction={direction} data-align={align} data-justify={justify} data-mb={mb}>
      {children}
    </div>
  ),
  Badge: ({ children, color, variant, radius, highContrast }: any) => (
    <span data-testid="badge" data-color={color} data-variant={variant}>
      {children}
    </span>
  ),
}));

// ─── Mock @radix-ui/react-dialog ─────────────────────────────────────────────
jest.mock('@radix-ui/react-dialog', () => ({
  Root: ({ children, open, onOpenChange }: any) => (
    <div data-testid="dialog-root" data-open={open}>
      {open ? children : null}
    </div>
  ),
  Portal: ({ children, container }: any) => <div data-testid="dialog-portal">{children}</div>,
  Overlay: ({ children, style }: any) => <div data-testid="dialog-overlay" style={style}>{children}</div>,
  Content: ({ children, style }: any) => <div data-testid="dialog-content" style={style}>{children}</div>,
  Title: ({ children, style }: any) => <h2 data-testid="dialog-title" style={style}>{children}</h2>,
  Description: ({ children }: any) => <div data-testid="dialog-description">{children}</div>,
}));

// ─── Mock @radix-ui/react-icons ──────────────────────────────────────────────
jest.mock('@radix-ui/react-icons', () => ({
  EyeOpenIcon: () => <span data-testid="eye-open-icon" />,
  EyeClosedIcon: () => <span data-testid="eye-closed-icon" />,
  ClipboardCopyIcon: () => <span data-testid="clipboard-copy-icon" />,
  TrashIcon: () => <span data-testid="trash-icon" />,
  Cross2Icon: () => <span data-testid="cross2-icon" />,
  PlusIcon: () => <span data-testid="plus-icon" />,
  ExitIcon: () => <span data-testid="exit-icon" />,
}));

// ─── Mock @radix-ui/react-toast ──────────────────────────────────────────────
jest.mock('@radix-ui/react-toast', () => ({
  Provider: ({ children, swipeDirection, duration }: any) => (
    <div data-testid="toast-provider">{children}</div>
  ),
  Root: ({ children, open, onOpenChange }: any) => (
    open ? <div data-testid="toast-root">{children}</div> : null
  ),
  Viewport: ({ children, style }: any) => (
    <div data-testid="toast-viewport" style={style}>{children}</div>
  ),
}));

// ─── Mock hooks ──────────────────────────────────────────────────────────────
jest.mock('../../hooks/useLinkWallet', () => ({
  useLinkWallet: jest.fn(),
}));

jest.mock('../../hooks/useFullDisconnect', () => ({
  useFullDisconnect: jest.fn(),
}));

// ─── Mock auth context ───────────────────────────────────────────────────────
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// ─── Mock services ───────────────────────────────────────────────────────────
jest.mock('../../services/apiKeys', () => ({
  apiKeysService: {
    list: jest.fn(),
    create: jest.fn(),
    revoke: jest.fn(),
  },
}));

jest.mock('../../services/profile', () => ({
  profileService: {
    get: jest.fn(),
  },
}));

jest.mock('../../services/score', () => ({
  scoreService: {
    get: jest.fn(),
  },
}));

// ─── Mock @tanstack/react-query ──────────────────────────────────────────────
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

// ─── Import mocked helpers ───────────────────────────────────────────────────
const { useQuery } = jest.requireMock('@tanstack/react-query');
const { useAuth } = jest.requireMock('../../contexts/AuthContext');
const { useLinkWallet } = jest.requireMock('../../hooks/useLinkWallet');
const { useFullDisconnect } = jest.requireMock('../../hooks/useFullDisconnect');
const { apiKeysService } = jest.requireMock('../../services/apiKeys');

// ─── Test helpers ────────────────────────────────────────────────────────────

const mockAuth = (overrides: Partial<{ isAuthenticated: boolean; isLoading: boolean; authToken: { token: string; expires_at: number } }> = {}) => {
  useAuth.mockReturnValue({
    isAuthenticated: true,
    isLoading: false,
    authToken: { token: 'test-token', expires_at: Date.now() / 1000 + 86400 },
    ...overrides,
  });
};

const mockLinkWallet = (overrides: Partial<{ handleLinkWallet: jest.Mock; status: string }> = {}) => {
  useLinkWallet.mockReturnValue({
    handleLinkWallet: jest.fn(),
    status: 'idle',
    ...overrides,
  });
};

const mockFullDisconnectHook = (overrides: Partial<{ fullDisconnect: jest.Mock }> = {}) => {
  useFullDisconnect.mockReturnValue({
    fullDisconnect: jest.fn(),
    ...overrides,
  });
};

const setupUseQueryMocks = (overrides: {
  profileData?: any;
  scoreData?: any;
  apiKeysData?: any[];
  isLoadingKeys?: boolean;
  isLoadingProfile?: boolean;
  isLoadingScore?: boolean;
} = {}) => {
  const {
    profileData = { profile: { id: '1', name: 'Test User', display_name: 'Test Builder', accounts: [{ source: 'github', identifier: 'testuser', connected_at: '2024-01-01', imported_from: null, owned_since: null, username: 'testuser' }] } },
    scoreData = { score: { points: 200, slug: 'test', calculating_score: false, calculating_score_enqueued_at: null, last_calculated_at: null } },
    apiKeysData = [],
    isLoadingKeys = false,
    isLoadingProfile = false,
    isLoadingScore = false,
  } = overrides;

  useQuery.mockImplementation(({ queryKey }: any) => {
    if (queryKey[0] === 'apiKeys') {
      return {
        data: { api_keys: apiKeysData, pagination: { current_page: 1, last_page: 1, total: apiKeysData.length, total_for_all: apiKeysData.length } },
        isLoading: isLoadingKeys,
        refetch: jest.fn().mockResolvedValue({}),
      };
    }
    if (queryKey[0] === 'profile') {
      return {
        data: profileData,
        isLoading: isLoadingProfile,
      };
    }
    if (queryKey[0] === 'score') {
      return {
        data: scoreData,
        isLoading: isLoadingScore,
      };
    }
    return { data: undefined, isLoading: false };
  });
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ApiKeysManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth();
    mockLinkWallet();
    mockFullDisconnectHook();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('loading state', () => {
    it('should show loading message when auth is loading', () => {
      mockAuth({ isLoading: true });
      setupUseQueryMocks();
      render(<ApiKeysManager />);
      expect(screen.getByText('Loading…')).toBeInTheDocument();
    });
  });

  describe('unauthenticated state', () => {
    it('should show connect wallet message when not authenticated', () => {
      mockAuth({ isAuthenticated: false, isLoading: false });
      mockLinkWallet({ status: 'idle' });
      setupUseQueryMocks();
      render(<ApiKeysManager />);
      expect(screen.getByText('Connect your wallet')).toBeInTheDocument();
    });

    it('should show "Connect Wallet" button when idle', () => {
      mockAuth({ isAuthenticated: false, isLoading: false });
      mockLinkWallet({ status: 'idle' });
      setupUseQueryMocks();
      render(<ApiKeysManager />);
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });

    it('should show "Connecting…" button when connecting', () => {
      mockAuth({ isAuthenticated: false, isLoading: false });
      mockLinkWallet({ status: 'connecting' });
      setupUseQueryMocks();
      render(<ApiKeysManager />);
      expect(screen.getByText('Connecting…')).toBeInTheDocument();
    });

    it('should show "Signing…" button when signing', () => {
      mockAuth({ isAuthenticated: false, isLoading: false });
      mockLinkWallet({ status: 'signing' });
      setupUseQueryMocks();
      render(<ApiKeysManager />);
      expect(screen.getByText('Signing…')).toBeInTheDocument();
    });

    it('should call handleLinkWallet when connect button is clicked', () => {
      const handleLinkWallet = jest.fn();
      mockAuth({ isAuthenticated: false, isLoading: false });
      mockLinkWallet({ status: 'idle', handleLinkWallet });
      setupUseQueryMocks();
      render(<ApiKeysManager />);
      fireEvent.click(screen.getByText('Connect Wallet'));
      expect(handleLinkWallet).toHaveBeenCalledTimes(1);
    });

    it('should disable connect button when busy', () => {
      mockAuth({ isAuthenticated: false, isLoading: false });
      mockLinkWallet({ status: 'connecting' });
      setupUseQueryMocks();
      render(<ApiKeysManager />);
      expect(screen.getByText('Connecting…')).toBeDisabled();
    });
  });

  describe('authenticated state', () => {
    it('should show welcome message with display name', () => {
      setupUseQueryMocks();
      render(<ApiKeysManager />);
      expect(screen.getByText('Welcome, Test Builder')).toBeInTheDocument();
    });

    it('should show builder score', () => {
      setupUseQueryMocks();
      render(<ApiKeysManager />);
      expect(screen.getByText(/Builder Score:/)).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
    });

    it('should show docs link', () => {
      setupUseQueryMocks();
      render(<ApiKeysManager />);
      const link = screen.getByRole('link', { name: 'here' });
      expect(link).toHaveAttribute('href', '/docs/developers/talent-api/api-reference');
    });
  });

  describe('API keys list', () => {
    it('should show "Loading keys…" when keys are loading', () => {
      setupUseQueryMocks({ isLoadingKeys: true });
      render(<ApiKeysManager />);
      expect(screen.getByText('Loading keys…')).toBeInTheDocument();
    });

    it('should show "No API keys yet" when there are no keys', () => {
      setupUseQueryMocks({ apiKeysData: [] });
      render(<ApiKeysManager />);
      expect(screen.getByText('No API keys yet.')).toBeInTheDocument();
    });

    it('should render API key cards when keys exist', () => {
      const keys = [
        {
          id: 'key-1',
          name: 'My Key',
          description: 'A test key',
          access_key: 'sk_test_abcdefghijklmnop',
          current_usage: 50,
          activated_at: '2024-01-01T00:00:00Z',
          revoked_at: null,
          revoked_reason: null,
        },
      ];
      setupUseQueryMocks({ apiKeysData: keys });
      render(<ApiKeysManager />);
      expect(screen.getByText('My Key')).toBeInTheDocument();
      expect(screen.getByText('A test key')).toBeInTheDocument();
    });

    it('should show masked key value by default', () => {
      const keys = [
        {
          id: 'key-1',
          name: 'My Key',
          description: null,
          access_key: 'sk_test_abcdefghijklmnop',
          current_usage: 50,
          activated_at: '2024-01-01T00:00:00Z',
          revoked_at: null,
          revoked_reason: null,
        },
      ];
      setupUseQueryMocks({ apiKeysData: keys });
      render(<ApiKeysManager />);
      // Masked: first 4 chars + bullet dots + last 4 chars = "sk_t" + "••••••••••••" + "mnop"
      const codeElement = screen.getByText(/sk_t/);
      expect(codeElement).toBeInTheDocument();
      // The full key should NOT be visible
      expect(screen.queryByText('sk_test_abcdefghijklmnop')).not.toBeInTheDocument();
    });

    it('should reveal key value when eye icon is clicked', () => {
      const keys = [
        {
          id: 'key-1',
          name: 'My Key',
          description: null,
          access_key: 'sk_test_abcdefghijklmnop',
          current_usage: 50,
          activated_at: '2024-01-01T00:00:00Z',
          revoked_at: null,
          revoked_reason: null,
        },
      ];
      setupUseQueryMocks({ apiKeysData: keys });
      render(<ApiKeysManager />);

      const eyeButton = screen.getByLabelText('Show key');
      fireEvent.click(eyeButton);

      expect(screen.getByText('sk_test_abcdefghijklmnop')).toBeInTheDocument();
    });

    it('should hide key value when eye icon is clicked again', () => {
      const keys = [
        {
          id: 'key-1',
          name: 'My Key',
          description: null,
          access_key: 'sk_test_abcdefghijklmnop',
          current_usage: 50,
          activated_at: '2024-01-01T00:00:00Z',
          revoked_at: null,
          revoked_reason: null,
        },
      ];
      setupUseQueryMocks({ apiKeysData: keys });
      render(<ApiKeysManager />);

      // Reveal
      fireEvent.click(screen.getByLabelText('Show key'));
      expect(screen.getByText('sk_test_abcdefghijklmnop')).toBeInTheDocument();

      // Hide
      fireEvent.click(screen.getByLabelText('Hide key'));
      // Should be masked again - the full key should NOT be visible
      expect(screen.queryByText('sk_test_abcdefghijklmnop')).not.toBeInTheDocument();
    });

    it('should copy key to clipboard when copy button is clicked', async () => {
      const keys = [
        {
          id: 'key-1',
          name: 'My Key',
          description: null,
          access_key: 'sk_test_abcdefghijklmnop',
          current_usage: 50,
          activated_at: '2024-01-01T00:00:00Z',
          revoked_at: null,
          revoked_reason: null,
        },
      ];
      setupUseQueryMocks({ apiKeysData: keys });
      render(<ApiKeysManager />);

      const copyButton = screen.getByLabelText('Copy key');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('sk_test_abcdefghijklmnop');
      });
    });

    it('should show "Active" badge for non-revoked keys', () => {
      const keys = [
        {
          id: 'key-1',
          name: 'My Key',
          description: null,
          access_key: 'sk_test_abcdefghijklmnop',
          current_usage: 50,
          activated_at: '2024-01-01T00:00:00Z',
          revoked_at: null,
          revoked_reason: null,
        },
      ];
      setupUseQueryMocks({ apiKeysData: keys });
      render(<ApiKeysManager />);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should show "Revoked" badge for revoked keys', () => {
      const keys = [
        {
          id: 'key-1',
          name: 'My Key',
          description: null,
          access_key: 'sk_test_abcdefghijklmnop',
          current_usage: 50,
          activated_at: '2024-01-01T00:00:00Z',
          revoked_at: '2024-06-01T00:00:00Z',
          revoked_reason: null,
        },
      ];
      setupUseQueryMocks({ apiKeysData: keys });
      render(<ApiKeysManager />);
      expect(screen.getByText('Revoked')).toBeInTheDocument();
    });

    it('should disable delete button for revoked keys', () => {
      const keys = [
        {
          id: 'key-1',
          name: 'My Key',
          description: null,
          access_key: 'sk_test_abcdefghijklmnop',
          current_usage: 50,
          activated_at: '2024-01-01T00:00:00Z',
          revoked_at: '2024-06-01T00:00:00Z',
          revoked_reason: null,
        },
      ];
      setupUseQueryMocks({ apiKeysData: keys });
      render(<ApiKeysManager />);
      const deleteButton = screen.getByLabelText('Delete key');
      expect(deleteButton).toBeDisabled();
    });

    it('should enable delete button for active keys', () => {
      const keys = [
        {
          id: 'key-1',
          name: 'My Key',
          description: null,
          access_key: 'sk_test_abcdefghijklmnop',
          current_usage: 50,
          activated_at: '2024-01-01T00:00:00Z',
          revoked_at: null,
          revoked_reason: null,
        },
      ];
      setupUseQueryMocks({ apiKeysData: keys });
      render(<ApiKeysManager />);
      const deleteButton = screen.getByLabelText('Delete key');
      expect(deleteButton).not.toBeDisabled();
    });

    it('should show usage information for each key', () => {
      const keys = [
        {
          id: 'key-1',
          name: 'My Key',
          description: null,
          access_key: 'sk_test_abcdefghijklmnop',
          current_usage: 500,
          activated_at: '2024-01-01T00:00:00Z',
          revoked_at: null,
          revoked_reason: null,
        },
      ];
      setupUseQueryMocks({ apiKeysData: keys });
      render(<ApiKeysManager />);
      expect(screen.getByText('Usage: 500/1000')).toBeInTheDocument();
    });
  });

  describe('revoke key dialog', () => {
    it('should open revoke dialog when delete button is clicked', () => {
      const keys = [
        {
          id: 'key-1',
          name: 'My Key',
          description: null,
          access_key: 'sk_test_abcdefghijklmnop',
          current_usage: 50,
          activated_at: '2024-01-01T00:00:00Z',
          revoked_at: null,
          revoked_reason: null,
        },
      ];
      setupUseQueryMocks({ apiKeysData: keys });
      render(<ApiKeysManager />);

      const deleteButton = screen.getByLabelText('Delete key');
      fireEvent.click(deleteButton);

      expect(screen.getByText('Revoke API Key?')).toBeInTheDocument();
    });

    it('should call revokeKey when revoke button is clicked', async () => {
      const keys = [
        {
          id: 'key-1',
          name: 'My Key',
          description: null,
          access_key: 'sk_test_abcdefghijklmnop',
          current_usage: 50,
          activated_at: '2024-01-01T00:00:00Z',
          revoked_at: null,
          revoked_reason: null,
        },
      ];
      apiKeysService.revoke.mockResolvedValue({});
      setupUseQueryMocks({ apiKeysData: keys });
      render(<ApiKeysManager />);

      // Open dialog
      fireEvent.click(screen.getByLabelText('Delete key'));

      // Click revoke
      const revokeButton = screen.getByText('Revoke');
      fireEvent.click(revokeButton);

      await waitFor(() => {
        expect(apiKeysService.revoke).toHaveBeenCalledWith('test-token', 'key-1');
      });
    });

    it('should close revoke dialog when cancel is clicked', () => {
      const keys = [
        {
          id: 'key-1',
          name: 'My Key',
          description: null,
          access_key: 'sk_test_abcdefghijklmnop',
          current_usage: 50,
          activated_at: '2024-01-01T00:00:00Z',
          revoked_at: null,
          revoked_reason: null,
        },
      ];
      setupUseQueryMocks({ apiKeysData: keys });
      render(<ApiKeysManager />);

      // Open dialog
      fireEvent.click(screen.getByLabelText('Delete key'));
      expect(screen.getByText('Revoke API Key?')).toBeInTheDocument();

      // Click cancel
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // Dialog should be closed
      expect(screen.queryByText('Revoke API Key?')).not.toBeInTheDocument();
    });

    it('should close revoke dialog when close icon is clicked', () => {
      const keys = [
        {
          id: 'key-1',
          name: 'My Key',
          description: null,
          access_key: 'sk_test_abcdefghijklmnop',
          current_usage: 50,
          activated_at: '2024-01-01T00:00:00Z',
          revoked_at: null,
          revoked_reason: null,
        },
      ];
      setupUseQueryMocks({ apiKeysData: keys });
      render(<ApiKeysManager />);

      // Open dialog
      fireEvent.click(screen.getByLabelText('Delete key'));
      expect(screen.getByText('Revoke API Key?')).toBeInTheDocument();

      // Click close icon (last "Close" labeled button)
      const closeButtons = screen.getAllByLabelText('Close');
      const dialogCloseButton = closeButtons[closeButtons.length - 1];
      fireEvent.click(dialogCloseButton);

      expect(screen.queryByText('Revoke API Key?')).not.toBeInTheDocument();
    });
  });

  describe('create API key dialog', () => {
    it('should open create dialog when "Create new API key" button is clicked', () => {
      setupUseQueryMocks();
      render(<ApiKeysManager />);

      const createButton = screen.getByText('Create new API key');
      fireEvent.click(createButton);

      expect(screen.getByRole('heading', { name: 'Create API Key' })).toBeInTheDocument();
    });

    it('should close create dialog when cancel is clicked', () => {
      setupUseQueryMocks();
      render(<ApiKeysManager />);

      // Open dialog
      fireEvent.click(screen.getByText('Create new API key'));
      expect(screen.getByRole('heading', { name: 'Create API Key' })).toBeInTheDocument();

      // Click cancel
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(screen.queryByRole('heading', { name: 'Create API Key' })).not.toBeInTheDocument();
    });

    it('should close create dialog when close icon is clicked', () => {
      setupUseQueryMocks();
      render(<ApiKeysManager />);

      // Open dialog
      fireEvent.click(screen.getByText('Create new API key'));
      expect(screen.getByRole('heading', { name: 'Create API Key' })).toBeInTheDocument();

      // Click close icon
      const closeButtons = screen.getAllByLabelText('Close');
      const dialogCloseButton = closeButtons[0];
      fireEvent.click(dialogCloseButton);

      expect(screen.queryByRole('heading', { name: 'Create API Key' })).not.toBeInTheDocument();
    });

    it('should disable create button when name is empty', () => {
      setupUseQueryMocks();
      render(<ApiKeysManager />);

      fireEvent.click(screen.getByText('Create new API key'));

      const createButtons = screen.getAllByText('Create API Key');
      const createButton = createButtons[createButtons.length - 1];
      expect(createButton).toBeDisabled();
    });

    it('should disable create button when description is empty', () => {
      setupUseQueryMocks();
      render(<ApiKeysManager />);

      fireEvent.click(screen.getByText('Create new API key'));

      const nameInput = screen.getByPlaceholderText('Enter project name');
      fireEvent.change(nameInput, { target: { value: 'My Project' } });

      const createButtons = screen.getAllByText('Create API Key');
      const createButton = createButtons[createButtons.length - 1];
      expect(createButton).toBeDisabled();
    });

    it('should enable create button when both name and description are filled', () => {
      setupUseQueryMocks();
      render(<ApiKeysManager />);

      fireEvent.click(screen.getByText('Create new API key'));

      const nameInput = screen.getByPlaceholderText('Enter project name');
      const descInput = screen.getByPlaceholderText('Enter project description');
      fireEvent.change(nameInput, { target: { value: 'My Project' } });
      fireEvent.change(descInput, { target: { value: 'My Description' } });

      const createButtons = screen.getAllByText('Create API Key');
      const createButton = createButtons[createButtons.length - 1];
      expect(createButton).not.toBeDisabled();
    });

    it('should call apiKeysService.create when form is submitted', async () => {
      apiKeysService.create.mockResolvedValue({
        id: 'new-key',
        name: 'My Project',
        description: 'My Description',
        access_key: 'sk_new_key',
        current_usage: 0,
        activated_at: '2024-01-01T00:00:00Z',
        revoked_at: null,
        revoked_reason: null,
      });
      setupUseQueryMocks();
      render(<ApiKeysManager />);

      fireEvent.click(screen.getByText('Create new API key'));

      const nameInput = screen.getByPlaceholderText('Enter project name');
      const descInput = screen.getByPlaceholderText('Enter project description');
      fireEvent.change(nameInput, { target: { value: 'My Project' } });
      fireEvent.change(descInput, { target: { value: 'My Description' } });

      const createButtons = screen.getAllByText('Create API Key');
      const createButton = createButtons[createButtons.length - 1];
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(apiKeysService.create).toHaveBeenCalledWith('test-token', {
          name: 'My Project',
          description: 'My Description',
        });
      });
    });

    it('should show "Creating…" while creating', async () => {
      apiKeysService.create.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({}), 100))
      );
      setupUseQueryMocks();
      render(<ApiKeysManager />);

      fireEvent.click(screen.getByText('Create new API key'));

      const nameInput = screen.getByPlaceholderText('Enter project name');
      const descInput = screen.getByPlaceholderText('Enter project description');
      fireEvent.change(nameInput, { target: { value: 'My Project' } });
      fireEvent.change(descInput, { target: { value: 'My Description' } });

      const createButtons = screen.getAllByText(/Create API Key|Creating…/);
      const createButton = createButtons[createButtons.length - 1];
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Creating…')).toBeInTheDocument();
      });
    });
  });

  describe('create key button disabled states', () => {
    it('should disable create button when no GitHub account', () => {
      setupUseQueryMocks({
        profileData: {
          profile: {
            id: '1',
            name: 'Test User',
            display_name: 'Test Builder',
            accounts: [{ source: 'twitter', identifier: 'testuser', connected_at: '2024-01-01', imported_from: null, owned_since: null, username: 'testuser' }],
          },
        },
      });
      render(<ApiKeysManager />);

      const createButton = screen.getByText('Create new API key');
      expect(createButton).toBeDisabled();
    });

    it('should disable create button when score is below 100', () => {
      setupUseQueryMocks({
        scoreData: {
          score: { points: 50, slug: 'test', calculating_score: false, calculating_score_enqueued_at: null, last_calculated_at: null },
        },
      });
      render(<ApiKeysManager />);

      const createButton = screen.getByText('Create new API key');
      expect(createButton).toBeDisabled();
    });

    it('should disable create button when score is exactly 100', () => {
      setupUseQueryMocks({
        scoreData: {
          score: { points: 100, slug: 'test', calculating_score: false, calculating_score_enqueued_at: null, last_calculated_at: null },
        },
      });
      render(<ApiKeysManager />);

      const createButton = screen.getByText('Create new API key');
      expect(createButton).toBeDisabled();
    });

    it('should enable create button when score is above 100 and has GitHub', () => {
      setupUseQueryMocks({
        scoreData: {
          score: { points: 101, slug: 'test', calculating_score: false, calculating_score_enqueued_at: null, last_calculated_at: null },
        },
      });
      render(<ApiKeysManager />);

      const createButton = screen.getByText('Create new API key');
      expect(createButton).not.toBeDisabled();
    });

    it('should show requirement text when user cannot create key', () => {
      setupUseQueryMocks({
        profileData: {
          profile: {
            id: '1',
            name: 'Test User',
            display_name: 'Test Builder',
            accounts: [{ source: 'twitter', identifier: 'testuser', connected_at: '2024-01-01', imported_from: null, owned_since: null, username: 'testuser' }],
          },
        },
        scoreData: {
          score: { points: 50, slug: 'test', calculating_score: false, calculating_score_enqueued_at: null, last_calculated_at: null },
        },
      });
      render(<ApiKeysManager />);

      expect(
        screen.getByText(/To create an API key you need a Builder Score > 100 and a connected GitHub account/)
      ).toBeInTheDocument();
    });

    it('should show requirement text without GitHub mention when score is low but GitHub is connected', () => {
      setupUseQueryMocks({
        scoreData: {
          score: { points: 50, slug: 'test', calculating_score: false, calculating_score_enqueued_at: null, last_calculated_at: null },
        },
      });
      render(<ApiKeysManager />);

      expect(
        screen.getByText(/To create an API key you need a Builder Score > 100\.$/)
      ).toBeInTheDocument();
    });
  });

  describe('logout', () => {
    it('should call fullDisconnect when logout button is clicked', () => {
      const fullDisconnect = jest.fn();
      mockFullDisconnectHook({ fullDisconnect });
      setupUseQueryMocks();
      render(<ApiKeysManager />);

      const logoutButtons = screen.getAllByText('Logout');
      fireEvent.click(logoutButtons[0]);

      expect(fullDisconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('multiple API keys', () => {
    it('should render multiple API key cards', () => {
      const keys = [
        {
          id: 'key-1',
          name: 'Key One',
          description: 'First key',
          access_key: 'sk_key1_abcdefghijklmnop',
          current_usage: 100,
          activated_at: '2024-01-01T00:00:00Z',
          revoked_at: null,
          revoked_reason: null,
        },
        {
          id: 'key-2',
          name: 'Key Two',
          description: 'Second key',
          access_key: 'sk_key2_abcdefghijklmnop',
          current_usage: 200,
          activated_at: '2024-02-01T00:00:00Z',
          revoked_at: null,
          revoked_reason: null,
        },
      ];
      setupUseQueryMocks({ apiKeysData: keys });
      render(<ApiKeysManager />);

      expect(screen.getByText('Key One')).toBeInTheDocument();
      expect(screen.getByText('Key Two')).toBeInTheDocument();
    });
  });

  describe('copy key error handling', () => {
    it('should handle clipboard write failure', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: jest.fn().mockRejectedValue(new Error('Clipboard error')) },
        configurable: true,
      });

      const keys = [
        {
          id: 'key-1',
          name: 'My Key',
          description: null,
          access_key: 'sk_test_abcdefghijklmnop',
          current_usage: 50,
          activated_at: '2024-01-01T00:00:00Z',
          revoked_at: null,
          revoked_reason: null,
        },
      ];
      setupUseQueryMocks({ apiKeysData: keys });
      render(<ApiKeysManager />);

      const copyButton = screen.getByLabelText('Copy key');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText('Could not copy key to clipboard.')).toBeInTheDocument();
      });
    });
  });

  describe('revoke key error handling', () => {
    it('should handle revoke failure', async () => {
      apiKeysService.revoke.mockRejectedValue(new Error('Revoke failed'));

      const keys = [
        {
          id: 'key-1',
          name: 'My Key',
          description: null,
          access_key: 'sk_test_abcdefghijklmnop',
          current_usage: 50,
          activated_at: '2024-01-01T00:00:00Z',
          revoked_at: null,
          revoked_reason: null,
        },
      ];
      setupUseQueryMocks({ apiKeysData: keys });
      render(<ApiKeysManager />);

      // Open dialog
      fireEvent.click(screen.getByLabelText('Delete key'));

      // Click revoke
      const revokeButton = screen.getByText('Revoke');
      fireEvent.click(revokeButton);

      await waitFor(() => {
        expect(apiKeysService.revoke).toHaveBeenCalledWith('test-token', 'key-1');
      });
    });
  });

  describe('create key error handling', () => {
    it('should handle create failure', async () => {
      apiKeysService.create.mockRejectedValue(new Error('Create failed'));

      setupUseQueryMocks();
      render(<ApiKeysManager />);

      fireEvent.click(screen.getByText('Create new API key'));

      const nameInput = screen.getByPlaceholderText('Enter project name');
      const descInput = screen.getByPlaceholderText('Enter project description');
      fireEvent.change(nameInput, { target: { value: 'My Project' } });
      fireEvent.change(descInput, { target: { value: 'My Description' } });

      const createButtons = screen.getAllByText('Create API Key');
      const createButton = createButtons[createButtons.length - 1];
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(apiKeysService.create).toHaveBeenCalledWith('test-token', {
          name: 'My Project',
          description: 'My Description',
        });
      });
    });
  });
});
