export type JsonHeadersOptions = {
  apiKey?: string;
  authToken?: string;
};

export function jsonHeaders(options: JsonHeadersOptions = {}): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "Talent Docs",
  };

  const envApiKey = process.env.TALENT_PROTOCOL_API_KEY;
  headers["X-API-KEY"] = envApiKey as string;

  if (options.authToken) {
    headers["Authorization"] = `Bearer ${options.authToken}`;
  }

  return headers;
}


