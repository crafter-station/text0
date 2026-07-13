import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelV1 } from "ai";

type MiniMaxApiFormat = "anthropic" | "openai";
type MiniMaxProvider = (modelId: string) => LanguageModelV1;

const DEFAULT_BASE_URLS: Record<MiniMaxApiFormat, string> = {
	anthropic: "https://api.minimax.io/anthropic",
	openai: "https://api.minimax.io/v1",
};

function createMiniMaxProvider(): MiniMaxProvider {
	const apiFormat = process.env.MINIMAX_API_FORMAT || "anthropic";

	if (apiFormat !== "anthropic" && apiFormat !== "openai") {
		throw new Error("MINIMAX_API_FORMAT must be either anthropic or openai");
	}

	const baseURL = (
		process.env.MINIMAX_BASE_URL || DEFAULT_BASE_URLS[apiFormat]
	).replace(/\/+$/, "");
	const apiKey = process.env.MINIMAX_API_KEY;

	if (apiFormat === "anthropic") {
		const provider = createAnthropic({
			baseURL: `${baseURL}/v1`,
			apiKey,
		});
		return (modelId) => provider(modelId);
	}

	const provider = createOpenAI({ baseURL, apiKey });
	return (modelId) => provider(modelId);
}

export const minimax = createMiniMaxProvider();
