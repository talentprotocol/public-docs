const API_URL = "https://api.talentprotocol.com/";
import { jsonHeaders } from "../utils/http";

export type ApiKey = {
  id: string;
  access_key: string;
  activated_at: string | null; // ISO string
  current_usage: number;
  description: string | null;
  name: string;
  revoked_at: string | null; // ISO string
  revoked_reason: string | null;
};

export type Pagination = {
  current_page: number;
  last_page: number;
  total: number;
  total_for_all: number;
};

export type ApiKeysResponse = {
  api_keys: ApiKey[];
  pagination: Pagination;
};

export class ApiKeysService {
  async list(authToken: string, page: number = 1): Promise<ApiKeysResponse> {
    const url = new URL("api_keys", API_URL);
    url.searchParams.set("page", String(page));

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
      throw new Error(`Failed to fetch API keys: ${errorMessage}`);
    }

    const data: ApiKeysResponse = await response.json();
    return data;
  }

  async create(authToken: string, params: { name: string; description: string }): Promise<ApiKey> {
    const url = new URL("api_keys", API_URL);
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: jsonHeaders({ authToken }),
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {}
      throw new Error(`Failed to create API key: ${errorMessage}`);
    }

    const data = await response.json();
    const created: ApiKey = (data && (data.api_key || data)) as ApiKey;
    return created;
  }

  async revoke(authToken: string, id: string, reason?: string | null): Promise<ApiKey> {
    const url = new URL(`api_keys/${id}/revoke`, API_URL);
    const response = await fetch(url.toString(), {
      method: "PUT",
      headers: jsonHeaders({ authToken }),
      body: JSON.stringify(reason ? { reason } : {}),
    });

    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {}
      throw new Error(`Failed to revoke API key: ${errorMessage}`);
    }

    const data = await response.json();
    const updated: ApiKey = (data && (data.api_key || data)) as ApiKey;
    return updated;
  }
}

export const apiKeysService = new ApiKeysService();


