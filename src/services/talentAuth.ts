const API_URL = "http://localhost:3000";
import { jsonHeaders } from "../utils/http";

interface AuthToken {
  token: string;
  expires_at: number;
}

interface NonceResponse {
  nonce: string;
}

interface AuthTokenResponse {
  auth: AuthToken;
}

export class TalentAuthService {
  async createNonce(address: string): Promise<string> {
    const response = await fetch(`${API_URL}/auth/create_nonce`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({
        address: address.toLowerCase(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create nonce: ${errorData.error || response.statusText}`);
    }

    const data: NonceResponse = await response.json();
    return data.nonce;
  }

  async createAuthToken(
    address: string,
    signature: string,
    chainId: number,
    siweMessage: string
  ): Promise<AuthToken> {
    const response = await fetch(`${API_URL}/auth/create_auth_token`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({
        address: address.toLowerCase(),
        signature,
        chain_id: chainId,
        siwe_message: siweMessage,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create auth token: ${errorData.error || response.statusText}`);
    }

    const data: AuthTokenResponse = await response.json();
    return data.auth;
  }

  async refreshAuthToken(authToken: string): Promise<AuthToken> {
    const response = await fetch(`${API_URL}/auth/refresh_auth_token`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({
        auth_token: authToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to refresh auth token: ${errorData.error || response.statusText}`);
    }

    const data: AuthTokenResponse = await response.json();
    return data.auth;
  }

  getSignMessage(nonce: string): string {
    return `Sign in with Talent Protocol\nnonce: ${nonce}`;
  }
}

// Create a singleton instance
export const talentAuthService = new TalentAuthService();
