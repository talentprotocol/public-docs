/// <reference types="jest" />
import { ScoreService, scoreService } from "./score";
import { jsonHeaders } from "../utils/http";

jest.mock("../utils/http", () => ({
  jsonHeaders: jest.fn(),
}));

const mockJsonHeaders = jsonHeaders as jest.MockedFunction<typeof jsonHeaders>;

const API_URL = "https://api.talentprotocol.com/";

describe("ScoreService", () => {
  let service: ScoreService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ScoreService();
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
      const mockResponse = {
        score: {
          calculating_score: false,
          calculating_score_enqueued_at: null,
          last_calculated_at: "2024-01-01T00:00:00Z",
          points: 100,
          slug: "test-slug",
        },
      };

      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.get({ slug: "test-slug" });

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}score?slug=test-slug`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json", "User-Agent": "Talent Docs" },
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it("should append multiple query params to the URL", async () => {
      const mockResponse = {
        score: {
          calculating_score: true,
          calculating_score_enqueued_at: "2024-01-01T00:00:00Z",
          last_calculated_at: null,
          points: 0,
          slug: "user-2",
        },
      };

      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await service.get({ slug: "user-2", page: 1, active: true });

      const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain("slug=user-2");
      expect(calledUrl).toContain("page=1");
      expect(calledUrl).toContain("active=true");
    });

    it("should skip undefined and null param values", async () => {
      const mockResponse = {
        score: {
          calculating_score: false,
          calculating_score_enqueued_at: null,
          last_calculated_at: null,
          points: 10,
          slug: "user-3",
        },
      };

      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await service.get({ slug: "user-3", skip: undefined, alsoSkip: null as any });

      const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain("slug=user-3");
      expect(calledUrl).not.toContain("skip");
      expect(calledUrl).not.toContain("alsoSkip");
    });

    it("should handle empty params object", async () => {
      const mockResponse = {
        score: {
          calculating_score: false,
          calculating_score_enqueued_at: null,
          last_calculated_at: null,
          points: 0,
          slug: "",
        },
      };

      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await service.get({});

      const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toBe(`${API_URL}score`);
    });

    it("should handle null params object", async () => {
      const mockResponse = {
        score: {
          calculating_score: false,
          calculating_score_enqueued_at: null,
          last_calculated_at: null,
          points: 0,
          slug: "",
        },
      };

      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await service.get(null as any);

      expect(global.fetch).toHaveBeenCalled();
    });

    it("should pass authToken to jsonHeaders", async () => {
      const mockResponse = {
        score: {
          calculating_score: false,
          calculating_score_enqueued_at: null,
          last_calculated_at: null,
          points: 50,
          slug: "user-1",
        },
      };

      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await service.get({ slug: "user-1" }, "my-token");

      expect(mockJsonHeaders).toHaveBeenCalledWith({ authToken: "my-token" });
    });

    it("should pass undefined authToken when not provided", async () => {
      const mockResponse = {
        score: {
          calculating_score: false,
          calculating_score_enqueued_at: null,
          last_calculated_at: null,
          points: 50,
          slug: "user-1",
        },
      };

      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      await service.get({ slug: "user-1" });

      expect(mockJsonHeaders).toHaveBeenCalledWith({ authToken: undefined });
    });

    it("should return parsed JSON response on success", async () => {
      const scoreData = {
        calculating_score: false,
        calculating_score_enqueued_at: "2024-06-15T10:30:00Z",
        last_calculated_at: "2024-06-14T10:30:00Z",
        points: 42.5,
        slug: "full-structure-test",
      };
      const mockResponse = { score: scoreData };

      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await service.get({ slug: "full-structure-test" });

      expect(result).toEqual(mockResponse);
      expect(result.score).toEqual(scoreData);
      expect(result.score.calculating_score).toBe(false);
      expect(result.score.calculating_score_enqueued_at).toBe("2024-06-15T10:30:00Z");
      expect(result.score.last_calculated_at).toBe("2024-06-14T10:30:00Z");
      expect(result.score.points).toBe(42.5);
      expect(result.score.slug).toBe("full-structure-test");
    });

    it("should throw an error with statusText when response is not ok and body has no error field", async () => {
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: "Not Found",
        json: jest.fn().mockResolvedValue({}),
      });

      await expect(service.get({ slug: "bad-slug" })).rejects.toThrow(
        "Failed to fetch score: Not Found"
      );
    });

    it("should throw an error with error field from response body when available", async () => {
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: "Bad Request",
        json: jest.fn().mockResolvedValue({ error: "Invalid slug provided" }),
      });

      await expect(service.get({ slug: "bad-slug" })).rejects.toThrow(
        "Failed to fetch score: Invalid slug provided"
      );
    });

    it("should fall back to statusText when JSON parsing fails on error response", async () => {
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: "Server Error",
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
      });

      await expect(service.get({ slug: "bad-slug" })).rejects.toThrow(
        "Failed to fetch score: Server Error"
      );
    });
  });

  describe("scoreService singleton", () => {
    it("should export a ScoreService instance", () => {
      expect(scoreService).toBeInstanceOf(ScoreService);
    });
  });
});
