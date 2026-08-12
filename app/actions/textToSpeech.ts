"use server";

import {
	createMiniMaxSpeechRequest,
	getMiniMaxSpeechConfig,
	parseMiniMaxSpeechResponse,
} from "@/lib/minimax-speech";

export async function textToSpeech(text: string) {
	try {
		const apiKey = process.env.MINIMAX_API_KEY;
		if (!apiKey) {
			throw new Error("MINIMAX_API_KEY is not configured");
		}

		const { endpoint, model, voiceId } = getMiniMaxSpeechConfig();
		const response = await fetch(endpoint, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(createMiniMaxSpeechRequest(text, model, voiceId)),
		});
		if (!response.ok) {
			throw new Error(`Speech synthesis request failed (${response.status})`);
		}

		const audioData = parseMiniMaxSpeechResponse(await response.json());

		return {
			success: true,
			audioData,
			contentType: "audio/mpeg",
		};
	} catch (error) {
		console.error("Text-to-speech error:", error);
		return {
			success: false,
			error: "Failed to convert text to speech",
		};
	}
}
