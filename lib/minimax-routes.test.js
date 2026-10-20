import { afterAll, expect, mock, test } from "bun:test";
import { NextRequest } from "next/server";
import { models } from "./models";

mock.module("@/lib/auth/server", () => ({
	getSecureSession: async () => ({ userId: "test-user" }),
}));
mock.module("@/lib/vector", () => ({
	vector: { query: async () => [] },
}));

const originalFetch = globalThis.fetch;
const originalKeys = {
	MINIMAX_API_KEY: process.env.MINIMAX_API_KEY,
	OPENAI_API_KEY: process.env.OPENAI_API_KEY,
};
process.env.MINIMAX_API_KEY = "test-minimax-key";
process.env.OPENAI_API_KEY = "test-openai-key";
const requests = [];
const text = "Test completion";
globalThis.fetch = async (url, init) => {
	const body = JSON.parse(init.body);
	requests.push({ url: String(url), body });
	const events = String(url).endsWith("/messages")
		? [
				{
					type: "message_start",
					message: {
						id: "message-test",
						type: "message",
						role: "assistant",
						model: body.model,
						content: [],
						usage: { input_tokens: 10, output_tokens: 0 },
					},
				},
				{
					type: "content_block_start",
					index: 0,
					content_block: { type: "text", text: "" },
				},
				{
					type: "content_block_delta",
					index: 0,
					delta: { type: "text_delta", text },
				},
				{ type: "content_block_stop", index: 0 },
				{
					type: "message_delta",
					delta: { stop_reason: "end_turn", stop_sequence: null },
					usage: { output_tokens: 2 },
				},
				{ type: "message_stop" },
			].map(
				(event) => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`,
			)
		: [
				`data: ${JSON.stringify({
					id: "chat-test",
					object: "chat.completion.chunk",
					created: 1,
					model: body.model,
					choices: [
						{ index: 0, delta: { content: text }, finish_reason: null },
					],
				})}\n\n`,
				`data: ${JSON.stringify({
					id: "chat-test",
					object: "chat.completion.chunk",
					created: 1,
					model: body.model,
					choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
					usage: { prompt_tokens: 10, completion_tokens: 2, total_tokens: 12 },
				})}\n\n`,
				"data: [DONE]\n\n",
			];
	return new Response(events.join(""), {
		headers: { "Content-Type": "text/event-stream" },
	});
};
afterAll(() => {
	globalThis.fetch = originalFetch;
	for (const [key, value] of Object.entries(originalKeys)) {
		if (value === undefined) delete process.env[key];
		else process.env[key] = value;
	}
});

// Keep the actual route handlers, streamText, and provider SDKs in the test path.
const { POST: chat } = await import("../app/api/chat/route");
const { POST: completion } = await import("../app/api/completion/route");
const format = process.env.MINIMAX_API_FORMAT || "anthropic";
const baseURL = (
	process.env.MINIMAX_BASE_URL ||
	(format === "anthropic"
		? "https://api.minimax.io/anthropic"
		: "https://api.minimax.io/v1")
).replace(/\/+$/, "");
const expectedURL = `${baseURL}${format === "anthropic" ? "/v1/messages" : "/chat/completions"}`;
const miniMaxModels = models.filter((model) => model.component === "minimax");

test("ordinary MiniMax choices are Flash first, followed by M3", () => {
	expect(miniMaxModels.map((model) => model.id)).toEqual([
		"MiniMax-M3.1-Flash",
		"MiniMax-M3",
	]);
});

for (const model of [
	miniMaxModels[0].id,
	"MiniMax-M3",
	"MiniMax-M2.7",
	"MiniMax-custom-saved-model",
]) {
	for (const route of ["chat", "completion"]) {
		test(`${route} serializes ${model} using ${format}`, async () => {
			requests.length = 0;
			const response =
				route === "chat"
					? await chat(
							new Request("http://localhost/api/chat", {
								method: "POST",
								body: JSON.stringify({
									model,
									messages: [{ role: "user", content: "Hello" }],
									references: [],
								}),
							}),
						)
					: await completion(
							new NextRequest(
								`http://localhost/api/completion?model=${model}`,
								{
									method: "POST",
									body: JSON.stringify({ prompt: "Hello", references: [] }),
								},
							),
						);
			expect(response.status).toBe(200);
			expect(await response.text()).toContain(text);
			expect(requests).toHaveLength(1);
			const { url, body } = requests[0];
			expect(url).toBe(expectedURL);
			expect(body.model).toBe(model);
			expect(body.stream).toBe(true);
			expect(body.max_tokens).toBe(
				model === "MiniMax-M3.1-Flash" ? 4096 : route === "chat" ? 2000 : 50,
			);
			expect(JSON.stringify(body.messages)).toContain("Hello");
			// Leave thinking and effort to each model's API defaults. In particular,
			// Flash must not receive disabled thinking or an unsupported effort.
			expect(body.thinking).toBeUndefined();
			expect(body.reasoning_effort).toBeUndefined();
			expect(body.output_config).toBeUndefined();
			expect(body.service_tier).toBeUndefined();
			expect(body.reasoning_split).toBeUndefined();
		});
	}
}

for (const route of ["chat", "completion"]) {
	test(`${route} retains its existing default request when no model is supplied`, async () => {
		requests.length = 0;
		const response =
			route === "chat"
				? await chat(
						new Request("http://localhost/api/chat", {
							method: "POST",
							body: JSON.stringify({
								messages: [{ role: "user", content: "Hello" }],
								references: [],
							}),
						}),
					)
				: await completion(
						new NextRequest("http://localhost/api/completion", {
							method: "POST",
							body: JSON.stringify({ prompt: "Hello", references: [] }),
						}),
					);
		expect(await response.text()).toContain(text);
		expect(requests).toHaveLength(1);
		expect(requests[0].url).toBe("https://api.openai.com/v1/chat/completions");
		expect(requests[0].body.model).toBe(
			route === "chat" ? "gpt-4" : "gpt-4o-mini",
		);
	});
}

test("chat retains image content through SDK serialization", async () => {
	requests.length = 0;
	const response = await chat(
		new Request("http://localhost/api/chat", {
			method: "POST",
			body: JSON.stringify({
				model: miniMaxModels[0].id,
				messages: [
					{
						role: "user",
						content: "Describe this image",
						experimental_attachments: [
							{
								contentType: "image/png",
								url: "data:image/png;base64,aGVsbG8=",
							},
						],
					},
				],
				references: [],
			}),
		}),
	);
	expect(await response.text()).toContain(text);
	const serialized = JSON.stringify(requests[0].body.messages);
	expect(serialized).toContain("Describe this image");
	expect(serialized).toContain("aGVsbG8=");
});
