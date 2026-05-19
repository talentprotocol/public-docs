/// <reference types="jest" />
import { ProfileService, profileService } from "./profile";
import { jsonHeaders } from "../utils/http";

jest.mock("../utils/http", () => ({
  jsonHeaders: jest.fn(),
}));

const mockJsonHeaders = jsonHeaders as jest.MockedFunction<typeof jsonHeaders>;

const API_URL = "https://api.talentprotocol.com/";

describe("ProfileService", () => {
  let service: ProfileService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ProfileService();
    mockJsonHeaders.mockReturnValue({
      "Content-Type": "application/json",
      "User-Agent": "Talent Docs",
    });
    delete (global as any).fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("get", () => {
    it("should call fetch with the correct URL and options", async () => {
      const mockResponse = { profile: { id: "1", name: "Test", accounts: [] } };
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.get({});

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}profile`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json", "User-Agent": "Talent Docs" },
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it("should append query params to the URL", async () => {
      const mockResponse = { profile: { id: "1", name: "Test", accounts: [] } };
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await service.get({ id: "123", chain: "eth" });

      const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain("id=123");
      expect(calledUrl).toContain("chain=eth");
    });

    it("should skip undefined and null param values", async () => {
      const mockResponse = { profile: { id: "1", name: "Test", accounts: [] } };
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await service.get({ valid: "yes", skip: undefined, alsoSkip: null as any });

      const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain("valid=yes");
      expect(calledUrl).not.toContain("skip");
      expect(calledUrl).not.toContain("alsoSkip");
    });

    it("should handle boolean param values", async () => {
      const mockResponse = { profile: { id: "1", name: "Test", accounts: [] } };
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await service.get({ active: true, disabled: false });

      const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain("active=true");
      expect(calledUrl).toContain("disabled=false");
    });

    it("should pass authToken to jsonHeaders", async () => {
      const mockResponse = { profile: { id: "1", name: "Test", accounts: [] } };
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await service.get({}, "my-token");

      expect(mockJsonHeaders).toHaveBeenCalledWith({ authToken: "my-token" });
    });

    it("should pass undefined authToken when not provided", async () => {
      const mockResponse = { profile: { id: "1", name: "Test", accounts: [] } };
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await service.get({});

      expect(mockJsonHeaders).toHaveBeenCalledWith({ authToken: undefined });
    });

    it("should return parsed JSON response on success", async () => {
      const profileData = {
        id: "42",
        name: "Alice",
        display_name: "Alice D.",
        accounts: [],
        ens: "alice.eth",
      };
      const mockResponse = { profile: profileData };
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.get({});

      expect(result).toEqual(mockResponse);
      expect(result.profile).toEqual(profileData);
    });

    it("should throw an error with statusText when response is not ok and body has no error field", async () => {
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: "Not Found",
        json: jest.fn().mockResolvedValue({}),
      });

      await expect(service.get({})).rejects.toThrow("Failed to fetch profile: Not Found");
    });

    it("should throw an error with error field from response body when available", async () => {
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: "Bad Request",
        json: jest.fn().mockResolvedValue({ error: "Invalid API key" }),
      });

      await expect(service.get({})).rejects.toThrow("Failed to fetch profile: Invalid API key");
    });

    it("should fall back to statusText when JSON parsing fails on error response", async () => {
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: "Server Error",
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
      });

      await expect(service.get({})).rejects.toThrow("Failed to fetch profile: Server Error");
    });

    it("should handle empty params object", async () => {
      const mockResponse = { profile: { id: "1", name: "Test", accounts: [] } };
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await service.get({});

      const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toBe(`${API_URL}profile`);
    });

    it("should handle null params object", async () => {
      const mockResponse = { profile: { id: "1", name: "Test", accounts: [] } };
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await service.get(null as any);

      expect(global.fetch).toHaveBeenCalled();
    });

    it("should handle numeric param values", async () => {
      const mockResponse = { profile: { id: "1", name: "Test", accounts: [] } };
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await service.get({ page: 1, limit: 25 });

      const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain("page=1");
      expect(calledUrl).toContain("limit=25");
    });
  });

  describe("profileService singleton", () => {
    it("should export a ProfileService instance", () => {
      expect(profileService).toBeInstanceOf(ProfileService);
    });
  });
});
