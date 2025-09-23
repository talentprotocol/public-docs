const API_URL = "https://api.talentprotocol.com/";
import { jsonHeaders } from "../utils/http";

export type ScoreParams = Record<string, string | number | boolean | undefined>;

export interface BuilderScore {
  calculating_score: boolean;
  calculating_score_enqueued_at: string | null;
  last_calculated_at: string | null;
  points: number;
  slug: string;
}

export interface ScoreResponse {
  score: BuilderScore;
}

export class ScoreService {
  async get(params: ScoreParams, authToken?: string): Promise<ScoreResponse> {
    const url = new URL("score", API_URL);
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
      throw new Error(`Failed to fetch score: ${errorMessage}`);
    }

    return await response.json();
  }
}

export const scoreService = new ScoreService();


