import { createOpenAI } from "@ai-sdk/openai";

const ATLASCLOUD_BASE_URL = "https://api.atlascloud.ai/v1";
const ATLASCLOUD_MODEL_PREFIX = "atlascloud/";

export function atlasCloud(modelId: string) {
	const apiKey = process.env.ATLASCLOUD_API_KEY;
	if (!apiKey) {
		throw new Error("ATLASCLOUD_API_KEY is required for Atlas Cloud models");
	}

	const provider = createOpenAI({
		apiKey,
		baseURL: ATLASCLOUD_BASE_URL,
	});

	return provider(modelId.replace(ATLASCLOUD_MODEL_PREFIX, ""));
}
