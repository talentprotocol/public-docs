/// <reference types="jest" />
import { ApiKeysService, apiKeysService } from "./apiKeys";
import { jsonHeaders } from "../utils/http";

jest.mock("../utils/http", () => ({
  jsonHeaders: jest.fn(),
}));

const mockJsonHeaders = jsonHeaders as jest.MockedFunction<typeof jsonHeaders>;

const API_URL = "https://api.talentprotocol.com/";

describe("ApiKeysService", () => {
  let service: ApiKeysService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ApiKeysService();
    mockJsonHeaders.mockReturnValue({
      "Content-Type": "application/json",
      "User-Agent": "Talent Docs",
    });
    delete (global as any).fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("list", () => {
    it("should fetch API keys with default page 1", async () => {
      const mockResponse = {
        api_keys: [
          {
            id: "1",
            access_key: "key_abc",
            activated_at: "2024-01-01T00:00:00Z",
            current_usage: 10,
            description: "Test key",
            name: "Test Key",
            revoked_at: null,
            revoked_reason: null,
          },
        ],
        pagination: {
          current_page: 1,
          last_page: 1,
          total: 1,
          total_for_all: 1,
        },
      };

      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.list("test-token");

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}api_keys?page=1`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json", "User-Agent": "Talent Docs" },
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it("should fetch API keys with a custom page number", async () => {
      const mockResponse = {
        api_keys: [],
        pagination: {
          current_page: 3,
          last_page: 5,
          total: 50,
          total_for_all: 50,
        },
      };

      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.list("test-token", 3);

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}api_keys?page=3`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json", "User-Agent": "Talent Docs" },
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it("should pass authToken to jsonHeaders", async () => {
      const mockResponse = {
        api_keys: [],
        pagination: { current_page: 1, last_page: 1, total: 0, total_for_all: 0 },
      };

      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await service.list("my-token");

      expect(mockJsonHeaders).toHaveBeenCalledWith({ authToken: "my-token" });
    });

    it("should throw an error with error field from response body when available", async () => {
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: "Unauthorized",
        json: jest.fn().mockResolvedValue({ error: "Invalid token" }),
      });

      await expect(service.list("bad-token")).rejects.toThrow(
        "Failed to fetch API keys: Invalid token"
      );
    });

    it("should throw an error with statusText when response is not ok and body has no error field", async () => {
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: "Internal Server Error",
        json: jest.fn().mockResolvedValue({}),
      });

      await expect(service.list("test-token")).rejects.toThrow(
        "Failed to fetch API keys: Internal Server Error"
      );
    });

    it("should fall back to statusText when JSON parsing fails on error response", async () => {
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: "Server Error",
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
      });

      await expect(service.list("test-token")).rejects.toThrow(
        "Failed to fetch API keys: Server Error"
      );
    });
  });

  describe("create", () => {
    it("should create an API key and return the api_key object", async () => {
      const mockResponse = {
        api_key: {
          id: "2",
          access_key: "key_new",
          activated_at: null,
          current_usage: 0,
          description: "New key",
          name: "New Key",
          revoked_at: null,
          revoked_reason: null,
        },
      };

      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.create("test-token", {
        name: "New Key",
        description: "New key",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}api_keys`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "User-Agent": "Talent Docs" },
          body: JSON.stringify({ name: "New Key", description: "New key" }),
        }
      );
      expect(result).toEqual(mockResponse.api_key);
    });

    it("should return the response body directly when api_key is not present", async () => {
      const mockResponse = {
        id: "3",
        access_key: "key_direct",
        activated_at: null,
        current_usage: 0,
        description: null,
        name: "Direct Key",
        revoked_at: null,
        revoked_reason: null,
      };

      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.create("test-token", {
        name: "Direct Key",
        description: "",
      });

      expect(result).toEqual(mockResponse);
    });

    it("should pass authToken to jsonHeaders", async () => {
      const mockResponse = {
        api_key: {
          id: "1",
          access_key: "key_1",
          activated_at: null,
          current_usage: 0,
          description: null,
          name: "Key",
          revoked_at: null,
          revoked_reason: null,
        },
      };

      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await service.create("my-token", { name: "Key", description: "Desc" });

      expect(mockJsonHeaders).toHaveBeenCalledWith({ authToken: "my-token" });
    });

    it("should throw an error with error field from response body when creation fails", async () => {
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: "Bad Request",
        json: jest.fn().mockResolvedValue({ error: "Name is required" }),
      });

      await expect(
        service.create("test-token", { name: "", description: "" })
      ).rejects.toThrow("Failed to create API key: Name is required");
    });

    it("should fall back to statusText when JSON parsing fails on error response", async () => {
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: "Service Unavailable",
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
      });

      await expect(
        service.create("test-token", { name: "Key", description: "Desc" })
      ).rejects.toThrow("Failed to create API key: Service Unavailable");
    });
  });

  describe("revoke", () => {
    it("should revoke an API key with a reason", async () => {
      const mockResponse = {
        api_key: {
          id: "1",
          access_key: "key_abc",
          activated_at: "2024-01-01T00:00:00Z",
          current_usage: 10,
          description: "Test key",
          name: "Test Key",
          revoked_at: "2024-06-01T00:00:00Z",
          revoked_reason: "Compromised",
        },
      };

      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.revoke("test-token", "1", "Compromised");

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}api_keys/1/revoke`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", "User-Agent": "Talent Docs" },
          body: JSON.stringify({ reason: "Compromised" }),
        }
      );
      expect(result).toEqual(mockResponse.api_key);
    });

    it("should revoke an API key without a reason", async () => {
      const mockResponse = {
        api_key: {
          id: "1",
          access_key: "key_abc",
          activated_at: "2024-01-01T00:00:00Z",
          current_usage: 10,
          description: "Test key",
          name: "Test Key",
          revoked_at: "2024-06-01T00:00:00Z",
          revoked_reason: null,
        },
      };

      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.revoke("test-token", "1");

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}api_keys/1/revoke`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", "User-Agent": "Talent Docs" },
          body: JSON.stringify({}),
        }
      );
      expect(result).toEqual(mockResponse.api_key);
    });

    it("should revoke an API key with null reason", async () => {
      const mockResponse = {
        api_key: {
          id: "1",
          access_key: "key_abc",
          activated_at: "2024-01-01T00:00:00Z",
          current_usage: 10,
          description: "Test key",
          name: "Test Key",
          revoked_at: "2024-06-01T00:00:00Z",
          revoked_reason: null,
        },
      };

      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.revoke("test-token", "1", null);

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}api_keys/1/revoke`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", "User-Agent": "Talent Docs" },
          body: JSON.stringify({}),
        }
      );
      expect(result).toEqual(mockResponse.api_key);
    });

    it("should return the response body directly when api_key is not present", async () => {
      const mockResponse = {
        id: "1",
        access_key: "key_abc",
        activated_at: "2024-01-01T00:00:00Z",
        current_usage: 10,
        description: "Test key",
        name: "Test Key",
        revoked_at: "2024-06-01T00:00:00Z",
        revoked_reason: "No reason",
      };

      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.revoke("test-token", "1", "No reason");

      expect(result).toEqual(mockResponse);
    });

    it("should pass authToken to jsonHeaders", async () => {
      const mockResponse = {
        api_key: {
          id: "1",
          access_key: "key_1",
          activated_at: null,
          current_usage: 0,
          description: null,
          name: "Key",
          revoked_at: null,
          revoked_reason: null,
        },
      };

      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await service.revoke("my-token", "1");

      expect(mockJsonHeaders).toHaveBeenCalledWith({ authToken: "my-token" });
    });

    it("should throw an error with error field from response body when revocation fails", async () => {
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: "Not Found",
        json: jest.fn().mockResolvedValue({ error: "API key not found" }),
      });

      await expect(service.revoke("test-token", "999")).rejects.toThrow(
        "Failed to revoke API key: API key not found"
      );
    });

    it("should fall back to statusText when JSON parsing fails on error response", async () => {
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: "Gateway Timeout",
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
      });

      await expect(service.revoke("test-token", "1")).rejects.toThrow(
        "Failed to revoke API key: Gateway Timeout"
      );
    });
  });

  describe("apiKeysService singleton", () => {
    it("should export a ApiKeysService instance", () => {
      expect(apiKeysService).toBeInstanceOf(ApiKeysService);
    });
  });
});
