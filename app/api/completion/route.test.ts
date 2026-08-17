import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
	createAuthServerMock,
	createStreamTextMock,
	createVectorMock,
	lastStreamModel,
	resetRouteMocks,
	streamTextCalls,
	stubModel,
} from "../__tests__/route-test-mocks";

mock.module("@/lib/auth/server", createAuthServerMock);
mock.module("@/lib/vector", createVectorMock);
mock.module("@/lib/minimax", () => ({
	minimax: stubModel("minimax"),
}));
mock.module("@ai-sdk/openai", () => ({
	openai: stubModel("openai"),
}));
mock.module("@ai-sdk/anthropic", () => ({
	anthropic: stubModel("anthropic"),
}));
mock.module("@ai-sdk/google", () => ({
	google: stubModel("google"),
}));
mock.module("@ai-sdk/xai", () => ({
	xai: stubModel("xai"),
}));
mock.module("@ai-sdk/groq", () => ({
	groq: stubModel("groq"),
}));
mock.module("ollama-ai-provider", () => ({
	ollama: stubModel("ollama"),
}));
mock.module("ai", () => ({
	streamText: createStreamTextMock(),
}));

const { NextRequest } = await import("next/server");
const { POST } = await import("./route");

function completionRequest(model: string, body?: Record<string, unknown>) {
	return new NextRequest(
		`http://localhost/api/completion?model=${encodeURIComponent(model)}`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				prompt: "Math Academy teaches",
				references: [],
				...body,
			}),
		},
	);
}

describe("POST /api/completion", () => {
	beforeEach(() => {
		resetRouteMocks();
	});

	test("happy path: gpt-4o-mini routes to openai and returns 200", async () => {
		const response = await POST(completionRequest("gpt-4o-mini"));

		expect(response.status).toBe(200);
		expect(await response.text()).toBe("stream");
		expect(streamTextCalls).toHaveLength(1);
		expect(lastStreamModel()).toEqual({
			id: "gpt-4o-mini",
			provider: "openai",
		});
	});

	test("routes claude-3-5-sonnet-latest to anthropic", async () => {
		const response = await POST(completionRequest("claude-3-5-sonnet-latest"));

		expect(response.status).toBe(200);
		expect(lastStreamModel()).toEqual({
			id: "claude-3-5-sonnet-latest",
			provider: "anthropic",
		});
	});

	test("routes grok-3-fast-beta to xai", async () => {
		const response = await POST(completionRequest("grok-3-fast-beta"));

		expect(response.status).toBe(200);
		expect(lastStreamModel()).toEqual({
			id: "grok-3-fast-beta",
			provider: "xai",
		});
	});

	test("routes gemini-2.0-flash-001 to google", async () => {
		const response = await POST(completionRequest("gemini-2.0-flash-001"));

		expect(response.status).toBe(200);
		expect(lastStreamModel()).toEqual({
			id: "gemini-2.0-flash-001",
			provider: "google",
		});
	});

	test("routes MiniMax-* to minimax", async () => {
		const response = await POST(completionRequest("MiniMax-Text-01"));

		expect(response.status).toBe(200);
		expect(lastStreamModel()).toEqual({
			id: "MiniMax-Text-01",
			provider: "minimax",
		});
	});

	test("unknown model falls back to openai gpt-4o-mini", async () => {
		const response = await POST(completionRequest("definitely-not-a-model"));

		expect(response.status).toBe(200);
		expect(lastStreamModel()).toEqual({
			id: "gpt-4o-mini",
			provider: "openai",
		});
	});
});
