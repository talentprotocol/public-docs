/// <reference types="jest" />
import { jsonHeaders } from "./http";

describe("jsonHeaders", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should return default headers with Content-Type and User-Agent", () => {
    process.env.TALENT_PROTOCOL_API_KEY = "test-api-key";
    const headers = jsonHeaders();
    expect(headers).toMatchObject({
      "Content-Type": "application/json",
      "User-Agent": "Talent Docs",
    });
  });

  it("should include X-API-KEY from environment variable", () => {
    process.env.TALENT_PROTOCOL_API_KEY = "my-secret-key";
    const headers = jsonHeaders();
    expect(headers).toHaveProperty("X-API-KEY", "my-secret-key");
  });

  it("should include Authorization header when authToken is provided", () => {
    process.env.TALENT_PROTOCOL_API_KEY = "test-api-key";
    const headers = jsonHeaders({ authToken: "some-token" });
    expect(headers).toHaveProperty("Authorization", "Bearer some-token");
  });

  it("should not include Authorization header when authToken is not provided", () => {
    process.env.TALENT_PROTOCOL_API_KEY = "test-api-key";
    const headers = jsonHeaders();
    expect(headers).not.toHaveProperty("Authorization");
  });

  it("should include all headers when both apiKey env and authToken are set", () => {
    process.env.TALENT_PROTOCOL_API_KEY = "env-api-key";
    const headers = jsonHeaders({ authToken: "auth-token" });
    expect(headers).toMatchObject({
      "Content-Type": "application/json",
      "User-Agent": "Talent Docs",
      "X-API-KEY": "env-api-key",
      Authorization: "Bearer auth-token",
    });
  });

  it("should accept an empty options object", () => {
    process.env.TALENT_PROTOCOL_API_KEY = "test-key";
    const headers = jsonHeaders({});
    expect(headers).toMatchObject({
      "Content-Type": "application/json",
      "User-Agent": "Talent Docs",
      "X-API-KEY": "test-key",
    });
  });

  it("should work when called with no arguments", () => {
    process.env.TALENT_PROTOCOL_API_KEY = "default-key";
    const headers = jsonHeaders();
    expect(headers).toMatchObject({
      "Content-Type": "application/json",
      "User-Agent": "Talent Docs",
      "X-API-KEY": "default-key",
    });
  });
});
