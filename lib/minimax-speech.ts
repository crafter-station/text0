const DEFAULT_SPEECH_ENDPOINT = "https://api.minimax.io/v1/t2a_v2";
const DEFAULT_SPEECH_MODEL = "speech-2.8-hd";
const DEFAULT_SPEECH_VOICE = "English_expressive_narrator";

interface MiniMaxSpeechResponse {
	data?: {
		audio?: string;
		status?: number;
	} | null;
	base_resp?: {
		status_code?: number;
		status_msg?: string;
	};
}

export function getMiniMaxSpeechConfig() {
	return {
		endpoint: process.env.MINIMAX_SPEECH_ENDPOINT || DEFAULT_SPEECH_ENDPOINT,
		model: process.env.MINIMAX_SPEECH_MODEL || DEFAULT_SPEECH_MODEL,
		voiceId: process.env.MINIMAX_SPEECH_VOICE_ID || DEFAULT_SPEECH_VOICE,
	};
}

export function createMiniMaxSpeechRequest(
	text: string,
	model: string,
	voiceId: string,
) {
	if (!text || text.length > 10_000) {
		throw new Error("Speech text must contain between 1 and 10,000 characters");
	}

	return {
		model,
		text,
		stream: false,
		language_boost: "auto",
		output_format: "hex",
		voice_setting: {
			voice_id: voiceId,
			speed: 1,
			vol: 1,
			pitch: 0,
		},
		audio_setting: {
			sample_rate: 32_000,
			bitrate: 128_000,
			format: "mp3",
			channel: 1,
		},
	};
}

export function parseMiniMaxSpeechResponse(payload: unknown): string {
	const response = payload as MiniMaxSpeechResponse;
	if (response.base_resp?.status_code !== 0) {
		throw new Error(
			response.base_resp?.status_msg || "Speech synthesis failed",
		);
	}

	const audio = response.data?.audio;
	if (
		response.data?.status !== 2 ||
		!audio ||
		audio.length % 2 !== 0 ||
		!/^[0-9a-f]+$/i.test(audio)
	) {
		throw new Error("Speech synthesis returned invalid audio data");
	}

	return Buffer.from(audio, "hex").toString("base64");
}
