import { elevenlabs } from "@ai-sdk/elevenlabs";
import { experimental_transcribe as transcribe } from "ai";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	try {
		const formData = await req.formData();
		const audioFile = formData.get("audio") as File;

		if (!audioFile) {
			return NextResponse.json(
				{ error: "Audio file is required" },
				{ status: 400 },
			);
		}

		const audioBytes = await audioFile.arrayBuffer();

		// Use ElevenLabs Scribe v1 for transcription
		const transcript = await transcribe({
			model: elevenlabs.transcription("scribe_v1"),
			audio: new Uint8Array(audioBytes),
		});

		return NextResponse.json({
			text: transcript.text,
			segments: transcript.segments,
			language: transcript.language,
			durationInSeconds: transcript.durationInSeconds,
		});
	} catch (error) {
		console.error("Transcription error:", error);
		return NextResponse.json(
			{ error: "Failed to transcribe audio" },
			{ status: 500 },
		);
	}
}
