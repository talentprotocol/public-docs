const API_URL = "https://api.talentprotocol.com/";
import { jsonHeaders } from "../utils/http";

export type ProfileParams = Record<string, string | number | boolean | undefined>;

export interface EmailAccount {
  id: number;
  confirmed: boolean;
  created_at: string;
  email_address: string;
  kind: string;
  last_confirmation_email_sent_at: string | null;
  primary: boolean;
}

export interface UserInfo {
  id: string;
  email?: string;
  main_wallet?: string;
  onchain_id?: number;
  admin?: boolean;
  builder_plus?: boolean;
  rank_position?: number;
  email_confirmed?: boolean;
  total_email_count?: number;
  created_at?: string;
  human_checkmark?: boolean;
  merged?: boolean;
  email_accounts?: EmailAccount[];
}

export interface AccountInfo {
  connected_at: string;
  identifier: string;
  imported_from: string | null;
  owned_since: string | null;
  source: string;
  username: string | null;
}

export interface TalentProfile {
  id: string;
  name: string;
  display_name?: string;
  image_url?: string;
  bio?: string;
  tags?: string[];
  human_checkmark?: boolean;
  rank_position?: number;
  accounts: AccountInfo[];
  user?: UserInfo;
  ens?: string;
  location?: string;
  main_wallet_address?: string;
  onchain_id?: number;
  onchain_since?: string;
  socials_refreshed_at?: string;
  refreshing_socials?: boolean;
  farcaster_primary_wallet_address?: string;
}

export interface ProfileResponse {
  profile: TalentProfile;
}

export class ProfileService {
  async get(params: ProfileParams, authToken?: string): Promise<ProfileResponse> {
    const url = new URL("profile", API_URL);
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    });

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: jsonHeaders({ authToken }),
    });

    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {}
      throw new Error(`Failed to fetch profile: ${errorMessage}`);
    }

    return await response.json();
  }
}

export const profileService = new ProfileService();


