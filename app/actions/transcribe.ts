"use server";

import { elevenlabs } from "@ai-sdk/elevenlabs";
import { experimental_transcribe as transcribe } from "ai";

export async function transcribeAudio(audioData: ArrayBuffer) {
	try {
		// Use ElevenLabs Scribe v1 for transcription
		const transcript = await transcribe({
			model: elevenlabs.transcription("scribe_v1"),
			audio: new Uint8Array(audioData),
		});

		return {
			success: true,
			text: transcript.text,
			segments: transcript.segments,
			language: transcript.language,
			durationInSeconds: transcript.durationInSeconds,
		};
	} catch (error) {
		console.error("Transcription error:", error);
		return {
			success: false,
			error: "Failed to transcribe audio",
		};
	}
}
