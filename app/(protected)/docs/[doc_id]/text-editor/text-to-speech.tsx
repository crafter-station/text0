"use client";

import { textToSpeech } from "@/app/actions/textToSpeech";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";

interface TextToSpeechProps {
	selectedText: string;
}

export function TextToSpeech({ selectedText }: TextToSpeechProps) {
	const [isConverting, setIsConverting] = useState(false);
	const [audioUrl, setAudioUrl] = useState<string | null>(null);
	const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
		null,
	);

	// Listen for the custom event
	useEffect(() => {
		const handleTextToSpeechEvent = (event: CustomEvent<{ text: string }>) => {
			if (event.detail.text) {
				convertTextToSpeech(event.detail.text);
			}
		};

		window.addEventListener(
			"text0:text-to-speech",
			handleTextToSpeechEvent as EventListener,
		);
		return () => {
			window.removeEventListener(
				"text0:text-to-speech",
				handleTextToSpeechEvent as EventListener,
			);
		};
	}, []);

	// Cleanup audio URL when component unmounts
	useEffect(() => {
		return () => {
			if (audioUrl) {
				URL.revokeObjectURL(audioUrl);
			}
		};
	}, [audioUrl]);

	const convertTextToSpeech = async (text: string) => {
		if (!text || isConverting) return;

		setIsConverting(true);
		try {
			const response = await textToSpeech(text);

			if (response.success && response.audioData) {
				// Create a blob from the base64 audio data
				const binaryData = atob(response.audioData);
				const bytes = new Uint8Array(binaryData.length);
				for (let i = 0; i < binaryData.length; i++) {
					bytes[i] = binaryData.charCodeAt(i);
				}

				// Create a blob and URL
				const blob = new Blob([bytes], {
					type: response.contentType || "audio/mpeg",
				});
				const url = URL.createObjectURL(blob);

				// Clean up previous URL if exists
				if (audioUrl) {
					URL.revokeObjectURL(audioUrl);
				}

				// Set the audio URL and create an audio element
				setAudioUrl(url);

				// Create new audio element if it doesn't exist
				if (!audioElement) {
					const audio = new Audio(url);
					setAudioElement(audio);
					audio.play();
				} else {
					// Update and play existing audio element
					audioElement.src = url;
					audioElement.play();
				}
			} else {
				console.error("Failed to convert text to speech:", response.error);
			}
		} catch (error) {
			console.error("Error converting text to speech:", error);
		} finally {
			setIsConverting(false);
		}
	};

	const handleTextToSpeech = () => {
		convertTextToSpeech(selectedText);
	};

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="outline"
					size="icon"
					className="flex h-8 w-8 items-center hover:bg-foreground/10 hover:dark:bg-muted"
					onClick={handleTextToSpeech}
					disabled={isConverting || !selectedText}
				>
					{isConverting ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Volume2 className="h-4 w-4" />
					)}
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				<p>Text to Speech</p>
			</TooltipContent>
		</Tooltip>
	);
}
