import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
	createAuthServerMock,
	createStreamTextMock,
	createVectorMock,
	lastStreamModel,
	resetRouteMocks,
	setSessionImpl,
	setVectorQueryImpl,
	streamTextCalls,
	stubModel,
	vectorQueryCalls,
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
mock.module("ai", () => ({
	streamText: createStreamTextMock(),
}));

const { POST } = await import("./route");

function chatRequest(body: Record<string, unknown>): Request {
	return new Request("http://localhost/api/chat", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}

const baseMessages = [{ role: "user", content: "Write a short hello" }];

describe("POST /api/chat", () => {
	beforeEach(() => {
		resetRouteMocks();
	});

	test("happy path: gpt-4o-mini routes to openai and returns 200", async () => {
		const response = await POST(
			chatRequest({
				messages: baseMessages,
				model: "gpt-4o-mini",
				references: [],
			}),
		);

		expect(response.status).toBe(200);
		expect(await response.text()).toBe("stream");
		expect(streamTextCalls).toHaveLength(1);
		expect(lastStreamModel()).toEqual({
			id: "gpt-4o-mini",
			provider: "openai",
		});
	});

	test("routes claude-* to anthropic", async () => {
		const response = await POST(
			chatRequest({
				messages: baseMessages,
				model: "claude-3-5-sonnet-latest",
				references: [],
			}),
		);

		expect(response.status).toBe(200);
		expect(lastStreamModel()).toEqual({
			id: "claude-3-5-sonnet-latest",
			provider: "anthropic",
		});
	});

	test("routes gemini-* to google", async () => {
		const response = await POST(
			chatRequest({
				messages: baseMessages,
				model: "gemini-2.0-flash-001",
				references: [],
			}),
		);

		expect(response.status).toBe(200);
		expect(lastStreamModel()).toEqual({
			id: "gemini-2.0-flash-001",
			provider: "google",
		});
	});

	test("routes grok-* to xai", async () => {
		const response = await POST(
			chatRequest({
				messages: baseMessages,
				model: "grok-3-fast-beta",
				references: [],
			}),
		);

		expect(response.status).toBe(200);
		expect(lastStreamModel()).toEqual({
			id: "grok-3-fast-beta",
			provider: "xai",
		});
	});

	test("routes MiniMax-* to minimax", async () => {
		const response = await POST(
			chatRequest({
				messages: baseMessages,
				model: "MiniMax-Text-01",
				references: [],
			}),
		);

		expect(response.status).toBe(200);
		expect(lastStreamModel()).toEqual({
			id: "MiniMax-Text-01",
			provider: "minimax",
		});
	});

	test("omitted model falls back to openai gpt-4", async () => {
		const response = await POST(
			chatRequest({
				messages: baseMessages,
				references: [],
			}),
		);

		expect(response.status).toBe(200);
		expect(lastStreamModel()).toEqual({
			id: "gpt-4",
			provider: "openai",
		});
	});

	test("high-score reference populates context path without crash", async () => {
		setVectorQueryImpl(async () => [
			{ score: 0.92, data: "Reference snippet about Mars." },
		]);

		const response = await POST(
			chatRequest({
				messages: baseMessages,
				model: "gpt-4o-mini",
				references: ["ref-1"],
			}),
		);

		expect(response.status).toBe(200);
		expect(streamTextCalls).toHaveLength(1);
		expect(vectorQueryCalls.length).toBeGreaterThanOrEqual(1);
		expect(streamTextCalls[0]?.system).toContain(
			"Reference snippet about Mars.",
		);
	});

	test("empty references array does not crash", async () => {
		const response = await POST(
			chatRequest({
				messages: baseMessages,
				model: "gpt-4o-mini",
				references: [],
			}),
		);

		expect(response.status).toBe(200);
		expect(streamTextCalls).toHaveLength(1);
		expect(vectorQueryCalls[0]?.filter).toBe("userId = 'test-user'");
	});

	test("session mock uses empty userId when DEFAULT_USER_ID is unset", async () => {
		const previous = process.env.DEFAULT_USER_ID;
		// biome-ignore lint/performance/noDelete: must truly unset; `= undefined` becomes the string "undefined"
		delete process.env.DEFAULT_USER_ID;

		try {
			setSessionImpl(async () => ({
				userId: process.env.DEFAULT_USER_ID ?? "",
			}));

			const response = await POST(
				chatRequest({
					messages: baseMessages,
					model: "gpt-4o-mini",
					references: [],
				}),
			);

			expect(response.status).toBe(200);
			expect(vectorQueryCalls[0]?.filter).toBe("userId = ''");
		} finally {
			if (previous === undefined) {
				// biome-ignore lint/performance/noDelete: restore unset state without stringifying undefined
				delete process.env.DEFAULT_USER_ID;
			} else {
				process.env.DEFAULT_USER_ID = previous;
			}
		}
	});
});
