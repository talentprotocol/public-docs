/// <reference types="jest" />
import { TalentAuthService, talentAuthService } from "./talentAuth";
import { jsonHeaders } from "../utils/http";

jest.mock("../utils/http", () => ({
  jsonHeaders: jest.fn(),
}));

const mockJsonHeaders = jsonHeaders as jest.MockedFunction<typeof jsonHeaders>;

const API_URL = "https://api.talentprotocol.com";

describe("TalentAuthService", () => {
  let service: TalentAuthService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new TalentAuthService();
    mockJsonHeaders.mockReturnValue({
      "Content-Type": "application/json",
      "User-Agent": "Talent Docs",
    });
    delete (global as any).fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("createNonce", () => {
    it("should call fetch with the correct URL, headers, and body", async () => {
      const mockResponse = { nonce: "abc123" };

      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.createNonce("0xABC123");

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/auth/create_nonce`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "User-Agent": "Talent Docs" },
          body: JSON.stringify({ address: "0xabc123" }),
        }
      );
      expect(result).toBe("abc123");
    });

    it("should lowercase the address before sending", async () => {
      const mockResponse = { nonce: "xyz789" };

      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await service.createNonce("0xDEF456");

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.address).toBe("0xdef456");
    });

    it("should return the nonce from the response", async () => {
      const mockResponse = { nonce: "test-nonce-value" };

      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.createNonce("0x123");

      expect(result).toBe("test-nonce-value");
    });

    it("should throw an error with error field from response body when response is not ok", async () => {
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: "Bad Request",
        json: jest.fn().mockResolvedValue({ error: "Invalid address" }),
      });

      await expect(service.createNonce("bad-address")).rejects.toThrow(
        "Failed to create nonce: Invalid address"
      );
    });

    it("should throw an error with statusText when response is not ok and body has no error field", async () => {
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: "Internal Server Error",
        json: jest.fn().mockResolvedValue({}),
      });

      await expect(service.createNonce("0x123")).rejects.toThrow(
        "Failed to create nonce: Internal Server Error"
      );
    });
  });

  describe("createAuthToken", () => {
    it("should call fetch with the correct URL, headers, and body", async () => {
      const mockResponse = {
        auth: {
          token: "auth-token-123",
          expires_at: 1700000000,
        },
      };

      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.createAuthToken(
        "0xABC123",
        "sig-abc",
        1,
        "Sign in with Talent Protocol\nnonce: abc123"
      );

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/auth/create_auth_token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "User-Agent": "Talent Docs" },
          body: JSON.stringify({
            address: "0xabc123",
            signature: "sig-abc",
            chain_id: 1,
            siwe_message: "Sign in with Talent Protocol\nnonce: abc123",
          }),
        }
      );
      expect(result).toEqual({ token: "auth-token-123", expires_at: 1700000000 });
    });

    it("should lowercase the address before sending", async () => {
      const mockResponse = {
        auth: { token: "t", expires_at: 100 },
      };

      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await service.createAuthToken("0xDEF456", "sig", 1, "msg");

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.address).toBe("0xdef456");
    });

    it("should return the auth object from the response", async () => {
      const mockResponse = {
        auth: {
          token: "my-token",
          expires_at: 1700000000,
        },
      };

      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.createAuthToken("0x123", "sig", 1, "msg");

      expect(result).toEqual(mockResponse.auth);
    });

    it("should throw an error with error field from response body when response is not ok", async () => {
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: "Unauthorized",
        json: jest.fn().mockResolvedValue({ error: "Invalid signature" }),
      });

      await expect(
        service.createAuthToken("0x123", "bad-sig", 1, "msg")
      ).rejects.toThrow("Failed to create auth token: Invalid signature");
    });

    it("should throw an error with statusText when response is not ok and body has no error field", async () => {
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: "Bad Gateway",
        json: jest.fn().mockResolvedValue({}),
      });

      await expect(
        service.createAuthToken("0x123", "sig", 1, "msg")
      ).rejects.toThrow("Failed to create auth token: Bad Gateway");
    });
  });

  describe("refreshAuthToken", () => {
    it("should call fetch with the correct URL, headers, and body", async () => {
      const mockResponse = {
        auth: {
          token: "refreshed-token",
          expires_at: 1800000000,
        },
      };

      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.refreshAuthToken("old-token");

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/auth/refresh_auth_token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "User-Agent": "Talent Docs" },
          body: JSON.stringify({ auth_token: "old-token" }),
        }
      );
      expect(result).toEqual({ token: "refreshed-token", expires_at: 1800000000 });
    });

    it("should return the auth object from the response", async () => {
      const mockResponse = {
        auth: {
          token: "new-token",
          expires_at: 1900000000,
        },
      };

      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.refreshAuthToken("some-token");

      expect(result).toEqual(mockResponse.auth);
    });

    it("should throw an error with error field from response body when response is not ok", async () => {
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: "Unauthorized",
        json: jest.fn().mockResolvedValue({ error: "Token expired" }),
      });

      await expect(service.refreshAuthToken("expired-token")).rejects.toThrow(
        "Failed to refresh auth token: Token expired"
      );
    });

    it("should throw an error with statusText when response is not ok and body has no error field", async () => {
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: "Service Unavailable",
        json: jest.fn().mockResolvedValue({}),
      });

      await expect(service.refreshAuthToken("some-token")).rejects.toThrow(
        "Failed to refresh auth token: Service Unavailable"
      );
    });
  });

  describe("getSignMessage", () => {
    it("should return the sign message with the nonce embedded", () => {
      const result = service.getSignMessage("abc123");

      expect(result).toBe("Sign in with Talent Protocol\nnonce: abc123");
    });

    it("should return a different message for a different nonce", () => {
      const result = service.getSignMessage("xyz789");

      expect(result).toBe("Sign in with Talent Protocol\nnonce: xyz789");
    });

    it("should handle an empty nonce", () => {
      const result = service.getSignMessage("");

      expect(result).toBe("Sign in with Talent Protocol\nnonce: ");
    });
  });

  describe("talentAuthService singleton", () => {
    it("should export a TalentAuthService instance", () => {
      expect(talentAuthService).toBeInstanceOf(TalentAuthService);
    });
  });
});
