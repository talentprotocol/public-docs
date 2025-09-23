import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Providers } from '../providers';
import { useAuth } from '../../contexts/AuthContext';
import { useLinkWallet } from '../../hooks/useLinkWallet';
import { useFullDisconnect } from '../../hooks/useFullDisconnect';
import { useQuery } from '@tanstack/react-query';
import { apiKeysService, type ApiKeysResponse, type ApiKey as RemoteApiKey } from '../../services/apiKeys';
import { profileService, type ProfileResponse } from '../../services/profile';
import { scoreService, type ScoreResponse } from '../../services/score';
import * as Dialog from '@radix-ui/react-dialog';
import { EyeOpenIcon, EyeClosedIcon, ClipboardCopyIcon, TrashIcon, Cross2Icon, PlusIcon, ExitIcon } from '@radix-ui/react-icons';
import { Button, IconButton, Theme, Card, Text, Flex, Badge } from '@radix-ui/themes';
import * as RToast from '@radix-ui/react-toast';

function ApiKeysManagerContent(): React.ReactElement {
  const { isAuthenticated, isLoading, authToken } = useAuth();
  const { handleLinkWallet, status } = useLinkWallet({ store: true });
  const { fullDisconnect } = useFullDisconnect();
  const [error, setError] = useState<string>('');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [createName, setCreateName] = useState<string>('');
  const [createDesc, setCreateDesc] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const portalRef = useRef<HTMLDivElement | null>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [toast, setToast] = useState<{ open: boolean; color?: 'green' | 'red' | 'gray'; title: string } | null>(null);

  useEffect(() => {
    // Keep the dialog portal inside the themed subtree so Radix variables apply
    if (portalRef.current) setPortalContainer(portalRef.current);
  }, []);

  const showToast = (title: string, color: 'green' | 'red' | 'gray' = 'green') => {
    setToast({ open: true, color, title });
  };

  // Fetch API keys from backend when authenticated
  const { data, isLoading: isLoadingKeys, refetch } = useQuery<ApiKeysResponse>({
    queryKey: ['apiKeys', authToken?.token],
    queryFn: async () => {
      if (!authToken?.token) throw new Error('Missing auth token');
      return await apiKeysService.list(authToken.token);
    },
    enabled: !!authToken?.token && isAuthenticated,
  });

  // Profile and score gates
  const { data: profile, isLoading: isLoadingProfile } = useQuery<ProfileResponse>({
    queryKey: ['profile', authToken?.token],
    queryFn: async () => {
      if (!authToken?.token) throw new Error('Missing auth token');
      return await profileService.get({}, authToken.token);
    },
    enabled: !!authToken?.token && isAuthenticated,
  });

  const { data: score, isLoading: isLoadingScore } = useQuery<ScoreResponse>({
    queryKey: ['score', authToken?.token],
    queryFn: async () => {
      if (!authToken?.token) throw new Error('Missing auth token');
      return await scoreService.get({}, authToken.token);
    },
    enabled: !!authToken?.token && isAuthenticated,
  });

  const hasGithub = !!profile?.profile?.accounts?.some((a) => a.source === 'github');
  const builderPoints = score?.score?.points ?? 0;
  const meetsScore = builderPoints > 100;
  const canCreateKey = hasGithub && meetsScore;

  const masked = (value: string): string => {
    if (!value) return '';
    const visible = 4;
    const dots = '•'.repeat(Math.max(0, value.length - visible * 2));
    return value.slice(0, visible) + dots + value.slice(-visible);
  };

  const revokeKey = async (id: string): Promise<void> => {
    if (!authToken?.token) return;
    try {
      await apiKeysService.revoke(authToken.token, id);
      showToast('API key revoked successfully.', 'green');
      await refetch();
    } catch (e: any) {
      showToast(e?.message || 'Failed to revoke API key', 'red');
    } finally {
      setConfirmRevokeId(null);
    }
  };

  const copyKey = async (value: string, id: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKeyId(id);
      setTimeout(() => setCopiedKeyId(null), 1500);
      showToast('Copied to the clipboard.', 'green');
    } catch {
      setError('Could not copy key to clipboard.');
      showToast('Could not copy key to clipboard.', 'red');
    }
  };
  
  const USAGE_LIMIT = 1000;
  const keyCards = useMemo(() => {
    const apiKeys: RemoteApiKey[] = data?.api_keys || [];
    return apiKeys.map((k) => {
      const isRevealed = revealed[k.id];
      const shownValue = isRevealed ? k.access_key : masked(k.access_key);
      const pct = Math.min(100, Math.round((k.current_usage / USAGE_LIMIT) * 100));
      const isRevoked = !!k.revoked_at;
      return (
        <Card key={k.id} variant="surface" size="3" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <Text as="div" size="5" weight="bold" style={{ marginBottom: 4 }}>{k.name}</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {k.description && <Text as="p" size="2" color="gray" style={{ margin: 0 }}>{k.description}</Text>}
                <Badge color={isRevoked ? 'red' : 'jade'} variant="soft" radius="full" highContrast>
                  {isRevoked ? 'Revoked' : 'Active'}
                </Badge>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <IconButton variant="ghost" size="2" radius="full" highContrast aria-label={isRevealed ? 'Hide key' : 'Show key'} onClick={() => setRevealed({ ...revealed, [k.id]: !isRevealed })}>
                {isRevealed ? <EyeClosedIcon width={16} height={16} /> : <EyeOpenIcon width={16} height={16} />}
              </IconButton>
              <IconButton variant="ghost" size="2" radius="full" highContrast aria-label="Copy key" onClick={() => copyKey(k.access_key, k.id)}>
                <ClipboardCopyIcon width={16} height={16} />
              </IconButton>
              <IconButton variant="ghost" color="red" size="2" radius="full" highContrast aria-label="Delete key" disabled={isRevoked} onClick={() => setConfirmRevokeId(k.id)}>
                <TrashIcon width={16} height={16} />
              </IconButton>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
            <code style={{ fontSize: 14, letterSpacing: 1, userSelect: 'text' }}>{shownValue}</code>
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text as="span" size="2" color="gray">Usage: {k.current_usage}/{USAGE_LIMIT}</Text>
            </div>
            <div style={{ height: 8, width: '100%', borderRadius: 8, background: 'var(--ifm-color-emphasis-200)' }}>
              <div style={{ height: 8, width: `${pct}%`, borderRadius: 8, background: 'var(--ifm-color-primary)' }} />
            </div>
          </div>
        </Card>
      );
    });
  }, [data, revealed, copiedKeyId]);

  if (isLoading) {
    return <p>Loading…</p>;
  }

  if (!isAuthenticated) {
    const isBusy = status !== 'idle';
    const buttonLabel = status === 'connecting' ? 'Connecting…' : status === 'signing' ? 'Signing…' : 'Connect Wallet';
    return (
      <div className="rounded-xl border border-zinc-700/60 bg-zinc-900 p-6">
        <h3 className="text-xl font-semibold mb-2">Connect your wallet</h3>
        <p className="mb-4">You need to connect one of your Talent Protocol wallets to manage your API keys.</p>
        <Button color="violet" onClick={() => handleLinkWallet()} disabled={isBusy}>
          {buttonLabel}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <p className="m-0 mb-4">Manage your Talent API keys below and access the docs <a className="text-violet-400" href="/docs/developers/talent-api/api-reference">here</a>.</p>

      {!isLoadingProfile && !isLoadingScore && (
        <Flex align="start" direction="column" mb="4">
          <Text as="p" size="5" style={{ margin: 0 }}>
            Welcome, {profile?.profile?.display_name || profile?.profile?.name || 'builder'}
          </Text>
          <Text as="p" size="3" color="gray" style={{ margin: 0 }}>
            Builder Score: <span style={{ color: 'var(--ifm-color-primary)' }}>{builderPoints}</span>
          </Text>
        </Flex>
      )}
      <Flex justify="between" mb="1">
        <Button
          variant="solid"
          color="violet"
          size="3"
          className="inline-flex items-center gap-2"
          onClick={() => setIsCreateOpen(true)}
          disabled={!canCreateKey || isLoadingProfile || isLoadingScore}
          title={!canCreateKey && !isLoadingProfile && !isLoadingScore ? 'Requires Builder Score > 100 and connected GitHub' : undefined}
        >
          <PlusIcon width={16} height={16} />
          Create new API key
        </Button>
        <Button variant="outline" color="gray" size="3" className="inline-flex items-center gap-2" onClick={() => fullDisconnect()}>
          <ExitIcon width={16} height={16} />
          Logout
        </Button>
      </Flex>
      {!isLoadingProfile && !isLoadingScore && !canCreateKey && (
        <Text as="p" size="2" color="gray" style={{ marginTop: 0, marginBottom: 8 }}>
          To create an API key you need a Builder Score &gt; 100{!hasGithub ? ' and a connected GitHub account' : ''}.
        </Text>
      )}
      
      <RToast.Provider swipeDirection="right" duration={2500}>
        {toast?.open && (
          <RToast.Root
            open={toast.open}
            onOpenChange={(open) => setToast((t) => (t ? { ...t, open } : t))}
          >
            <div style={{
              background: 'var(--ifm-background-surface-color, var(--ifm-background-color))',
              border: '1px solid var(--ifm-color-emphasis-300)',
              borderRadius: 8,
              padding: '10px 12px',
              color: 'inherit'
            }}>
              <strong>{toast.title}</strong>
            </div>
          </RToast.Root>
        )}
        <RToast.Viewport style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 2100, listStyle: 'none', margin: 0, padding: 0 }} />
      </RToast.Provider>
      <div ref={portalRef} />
      {isLoadingKeys ? (
        <p>Loading keys…</p>
      ) : (data?.api_keys?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-zinc-700/60 bg-zinc-900 p-6">
          <p className="m-0">No API keys yet.</p>
        </div>
      ) : (
        <div style={{ marginTop: 16 }}>
          {keyCards}
        </div>
      )}
      <Dialog.Root open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <Dialog.Portal container={portalContainer ?? undefined}>
          <Theme style={{ backgroundColor: 'transparent' }}>
            <Dialog.Overlay style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000 }} />
            <Dialog.Content
            style={{
              position: 'fixed',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              maxWidth: 720,
              borderRadius: 12,
              background: 'var(--ifm-background-surface-color, var(--ifm-background-color))',
              border: '1px solid var(--ifm-color-emphasis-300)',
              padding: 24,
              boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
              zIndex: 2001,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Dialog.Title style={{ fontSize: 24, fontWeight: 600 }}>Create API Key</Dialog.Title>
              <IconButton variant="ghost" size="2" highContrast onClick={() => setIsCreateOpen(false)} aria-label="Close">
                <Cross2Icon width={20} height={20} />
              </IconButton>
            </div>
            <p style={{ color: 'var(--ifm-color-emphasis-700)', marginBottom: 16 }}>
              Please provide a project name and description to receive your free API key. Note that these free keys come with rate and usage limits. If you plan to use the API in a production, please contact us at
              {' '}<a href="mailto:builders@talentprotocol.com" style={{ color: 'var(--ifm-color-primary)' }}>builders@talentprotocol.com</a>.
            </p>
            <div style={{ display: 'grid', gap: 12 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Project Name <span style={{ color: 'var(--ifm-color-danger)' }}>*</span></span>
                <input
                  type="text"
                  placeholder="Enter project name"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  style={{
                    borderRadius: 8,
                    border: '1px solid var(--ifm-color-emphasis-300)',
                    background: 'var(--ifm-background-color)',
                    color: 'inherit',
                    padding: '8px 12px',
                    width: '100%',
                  }}
                />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Project Description <span style={{ color: 'var(--ifm-color-danger)' }}>*</span></span>
                <textarea
                  placeholder="Enter project description"
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  style={{
                    borderRadius: 8,
                    border: '1px solid var(--ifm-color-emphasis-300)',
                    background: 'var(--ifm-background-color)',
                    color: 'inherit',
                    padding: '8px 12px',
                    width: '100%',
                  }}
                />
              </label>
            </div>
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="solid" color="gray" size="3" highContrast onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button variant="solid" color="violet" size="3" highContrast disabled={!createName || !createDesc || isCreating || !((profile && score) ? (profile.profile?.accounts?.some((a) => a.source === 'github') && (score.score?.points ?? 0) > 100) : false)} title={!((profile && score) ? (profile.profile?.accounts?.some((a) => a.source === 'github') && (score.score?.points ?? 0) > 100) : false) ? 'Requires Builder Score > 100 and connected GitHub' : undefined} onClick={async () => {
                if (!authToken?.token) return;
                setIsCreating(true);
                setError('');
                try {
                  await apiKeysService.create(authToken.token, { name: createName, description: createDesc });
                  setIsCreateOpen(false);
                  setCreateName('');
                  setCreateDesc('');
                  await refetch();
                } catch (e: any) {
                  setError(e?.message || 'Failed to create API key');
                } finally {
                  setIsCreating(false);
                }
              }}>{isCreating ? 'Creating…' : 'Create API Key'}</Button>
            </div>
            </Dialog.Content>
          </Theme>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Confirm Revoke Dialog */}
      <Dialog.Root open={!!confirmRevokeId} onOpenChange={(open) => { if (!open) setConfirmRevokeId(null); }}>
        <Dialog.Portal container={portalContainer ?? undefined}>
          <Theme style={{ backgroundColor: 'transparent' }}>
            <Dialog.Overlay style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000 }} />
            <Dialog.Content
              style={{
                position: 'fixed',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100%',
                maxWidth: 520,
                borderRadius: 12,
                background: 'var(--ifm-background-surface-color, var(--ifm-background-color))',
                border: '1px solid var(--ifm-color-emphasis-300)',
                padding: 20,
                boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
                zIndex: 2001,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Dialog.Title style={{ fontSize: 20, fontWeight: 600 }}>Revoke API Key?</Dialog.Title>
                <IconButton variant="ghost" size="2" highContrast onClick={() => setConfirmRevokeId(null)} aria-label="Close">
                  <Cross2Icon width={20} height={20} />
                </IconButton>
              </div>
              <p style={{ color: 'var(--ifm-color-emphasis-700)', marginBottom: 16 }}>
                This action cannot be undone. The selected API key will be revoked and will stop working immediately.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Button variant="solid" color="gray" size="3" highContrast onClick={() => setConfirmRevokeId(null)}>Cancel</Button>
                <Button variant="solid" color="red" size="3" highContrast onClick={() => confirmRevokeId && revokeKey(confirmRevokeId)}>Revoke</Button>
              </div>
            </Dialog.Content>
          </Theme>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

export default function ApiKeysManager(): React.ReactElement {
  return (
    <Providers>
      <ApiKeysManagerContent />
    </Providers>
  );
}


