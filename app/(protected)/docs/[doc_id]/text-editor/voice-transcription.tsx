"use client";

import { transcribeAudio } from "@/app/actions/transcribe";
import { Button } from "@/components/ui/button";
import { TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tooltip } from "@/components/ui/tooltip";
import { Mic, Square, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface VoiceTranscriptionProps {
	onTranscriptionComplete: (text: string) => void;
}

export function VoiceTranscription({
	onTranscriptionComplete,
}: VoiceTranscriptionProps) {
	const [isRecording, setIsRecording] = useState(false);
	const [isTranscribing, setIsTranscribing] = useState(false);
	const [showWaveform, setShowWaveform] = useState(false);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const audioChunksRef = useRef<Blob[]>([]);
	const audioContextRef = useRef<AudioContext | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const audioStreamRef = useRef<MediaStream | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const animationFrameRef = useRef<number | null>(null);
	const waveformDataRef = useRef<number[]>([]);
	const buttonRef = useRef<HTMLButtonElement | null>(null);
	const isCanceledRef = useRef<boolean>(false);

	// Initialize canvas with empty waveform
	useEffect(() => {
		const canvas = canvasRef.current;
		if (canvas) {
			const ctx = canvas.getContext("2d");
			if (ctx) {
				drawEmptyWaveform(ctx, canvas.width, canvas.height);
			}
		}

		return () => {
			// Cleanup on unmount
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}

			if (
				audioContextRef.current &&
				audioContextRef.current.state !== "closed"
			) {
				audioContextRef.current.close();
			}

			if (audioStreamRef.current) {
				for (const track of audioStreamRef.current.getTracks()) {
					track.stop();
				}
			}
		};
	}, []);

	const drawEmptyWaveform = (
		ctx: CanvasRenderingContext2D,
		width: number,
		height: number,
	) => {
		// Draw background
		ctx.fillStyle = "#222222";
		ctx.fillRect(0, 0, width, height);

		// Draw dotted line
		ctx.beginPath();
		ctx.setLineDash([5, 5]);
		ctx.strokeStyle = "#444444";
		ctx.moveTo(0, height / 2);
		ctx.lineTo(width, height / 2);
		ctx.stroke();

		// Initialize waveform data with minimal values
		waveformDataRef.current = Array(width).fill(2);
	};

	const startRecording = async () => {
		try {
			// Make sure we're not already recording
			if (isRecording) return;

			console.log("Starting recording...");

			// Reset cancellation flag
			isCanceledRef.current = false;

			// Show waveform display
			setShowWaveform(true);

			// Reset variables
			audioChunksRef.current = [];

			// Request microphone access
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
				},
			});
			audioStreamRef.current = stream;

			// Setup audio context and analyser
			const audioContext = new AudioContext();
			audioContextRef.current = audioContext;
			const analyser = audioContext.createAnalyser();
			analyserRef.current = analyser;
			analyser.fftSize = 256;

			const source = audioContext.createMediaStreamSource(stream);
			source.connect(analyser);

			// Setup media recorder
			const mediaRecorder = new MediaRecorder(stream);
			mediaRecorderRef.current = mediaRecorder;

			mediaRecorder.ondataavailable = (event) => {
				if (event.data && event.data.size > 0 && !isCanceledRef.current) {
					console.log("Data available from recorder");
					audioChunksRef.current.push(event.data);
				}
			};

			mediaRecorder.onstop = async () => {
				console.log("MediaRecorder stopped");
				setIsRecording(false);

				// Stop visualization
				if (animationFrameRef.current) {
					cancelAnimationFrame(animationFrameRef.current);
					animationFrameRef.current = null;
				}

				// Only proceed with transcription if not canceled
				if (!isCanceledRef.current) {
					setIsTranscribing(true);
					try {
						if (audioChunksRef.current.length === 0) {
							console.error("No audio data recorded");
							toast.error("No audio data was recorded");
							setIsTranscribing(false);
							setShowWaveform(false);
							return;
						}

						const audioBlob = new Blob(audioChunksRef.current, {
							type: "audio/webm",
						});
						console.log(`Audio blob size: ${audioBlob.size} bytes`);

						if (audioBlob.size === 0) {
							console.error("Empty audio blob");
							toast.error("No audio data was recorded");
							setIsTranscribing(false);
							setShowWaveform(false);
							return;
						}

						const arrayBuffer = await audioBlob.arrayBuffer();

						const result = await transcribeAudio(arrayBuffer);
						console.log("Transcription result:", result);

						if (result.success && result.text) {
							onTranscriptionComplete(result.text);
							toast.success("Transcription complete");
						} else {
							toast.error(result.error || "Transcription failed");
						}
					} catch (error) {
						console.error("Error processing transcription:", error);
						toast.error("Error processing transcription");
					} finally {
						setIsTranscribing(false);
						setShowWaveform(false);
					}
				} else {
					// If canceled, just reset the waveform
					setShowWaveform(false);
				}

				// Reset to empty waveform
				const canvas = canvasRef.current;
				if (canvas) {
					const ctx = canvas.getContext("2d");
					if (ctx) {
						drawEmptyWaveform(ctx, canvas.width, canvas.height);
					}
				}
			};

			// Initialize waveform data
			const canvas = canvasRef.current;
			if (canvas) {
				waveformDataRef.current = Array(canvas.width).fill(2);
			}

			// Start recording
			console.log("Starting MediaRecorder");
			mediaRecorder.start();
			setIsRecording(true);

			// Start visualization
			drawMovingWaveform();
		} catch (error) {
			console.error("Error accessing microphone:", error);
			toast.error(
				"Could not access microphone. Please make sure you've granted permission.",
			);
			setShowWaveform(false);
		}
	};

	const stopRecording = () => {
		console.log("Attempting to stop recording...");

		if (mediaRecorderRef.current && isRecording) {
			try {
				// Check if recorder is in recording state
				if (mediaRecorderRef.current.state === "recording") {
					console.log("Stopping MediaRecorder");
					isCanceledRef.current = false; // Ensure transcription proceeds
					mediaRecorderRef.current.stop();
				} else {
					console.log(
						"MediaRecorder not in recording state:",
						mediaRecorderRef.current.state,
					);
				}

				// Release microphone access
				if (audioStreamRef.current) {
					for (const track of audioStreamRef.current.getTracks()) {
						track.stop();
					}
				}

				// Close audio context
				if (
					audioContextRef.current &&
					audioContextRef.current.state !== "closed"
				) {
					audioContextRef.current.close();
				}
			} catch (err) {
				console.error("Error stopping recording:", err);
			}
		} else {
			console.log("No active recording to stop");
			setIsRecording(false);
			setShowWaveform(false);
		}
	};

	const cancelRecording = () => {
		console.log("Canceling recording...");

		if (mediaRecorderRef.current && isRecording) {
			try {
				// Set cancellation flag
				isCanceledRef.current = true;

				// Clear audio chunks to prevent any data collection
				audioChunksRef.current = [];

				// Stop the media recorder
				if (mediaRecorderRef.current.state === "recording") {
					console.log("Stopping MediaRecorder for cancellation");
					mediaRecorderRef.current.stop();
				}

				// Stop visualization
				if (animationFrameRef.current) {
					cancelAnimationFrame(animationFrameRef.current);
					animationFrameRef.current = null;
				}

				// Release microphone access
				if (audioStreamRef.current) {
					for (const track of audioStreamRef.current.getTracks()) {
						track.stop();
					}
				}

				// Close audio context
				if (
					audioContextRef.current &&
					audioContextRef.current.state !== "closed"
				) {
					audioContextRef.current.close();
				}

				// Reset states
				setIsRecording(false);
				setShowWaveform(false);

				// Reset to empty waveform
				const canvas = canvasRef.current;
				if (canvas) {
					const ctx = canvas.getContext("2d");
					if (ctx) {
						drawEmptyWaveform(ctx, canvas.width, canvas.height);
					}
				}

				toast.info("Recording canceled");
			} catch (err) {
				console.error("Error canceling recording:", err);
				toast.error("Error canceling recording");
			}
		} else {
			console.log("No active recording to cancel");
			setIsRecording(false);
			setShowWaveform(false);
			toast.info("Recording canceled");
		}
	};

	const drawMovingWaveform = () => {
		const canvas = canvasRef.current;
		if (!canvas || !analyserRef.current) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const width = canvas.width;
		const height = canvas.height;
		const centerY = height / 2;

		// Get frequency data
		const bufferLength = analyserRef.current.frequencyBinCount;
		const dataArray = new Uint8Array(bufferLength);
		analyserRef.current.getByteFrequencyData(dataArray);

		// Calculate average volume from frequency data
		let sum = 0;
		for (let i = 0; i < bufferLength; i++) {
			sum += dataArray[i];
		}
		const average = sum / bufferLength;

		// Scale the value to get a reasonable bar height (min 2, max half the canvas height)
		const barHeight = Math.max(
			2,
			Math.min((average / 255) * (height / 2), height / 2),
		);

		// Shift existing data to the left
		waveformDataRef.current.shift();

		// Add new data point at the end
		waveformDataRef.current.push(barHeight);

		// Clear canvas
		ctx.fillStyle = "#222222";
		ctx.fillRect(0, 0, width, height);

		// Draw dotted line
		ctx.beginPath();
		ctx.setLineDash([5, 5]);
		ctx.strokeStyle = "#444444";
		ctx.moveTo(0, height / 2);
		ctx.lineTo(width, height / 2);
		ctx.stroke();

		// Draw waveform
		ctx.setLineDash([]);
		ctx.strokeStyle = "#FFFFFF"; // White color for waveform
		ctx.lineWidth = 2;

		for (let i = 0; i < width; i++) {
			const barHeight = waveformDataRef.current[i] || 2;

			ctx.beginPath();
			ctx.moveTo(i, centerY - barHeight);
			ctx.lineTo(i, centerY + barHeight);
			ctx.stroke();
		}

		animationFrameRef.current = requestAnimationFrame(drawMovingWaveform);
	};

	const handleStartRecording = () => {
		console.log("Dictate button clicked");
		startRecording();
	};

	const handleStopRecording = () => {
		console.log("Stop recording button clicked");
		stopRecording();
	};

	return (
		<div className="flex flex-col items-center">
			{/* Waveform Display */}
			{showWaveform && (
				<div className="relative">
					<div className="-top-14 -translate-x-1/2 -translate-y-1/2 absolute left-1/2 mb-2 h-16 w-32 rounded bg-card p-1">
						<canvas
							ref={canvasRef}
							width={128}
							height={64}
							className="relative h-full w-full"
						/>
					</div>
					<Button
						size="icon"
						variant="outline"
						onClick={cancelRecording}
						className="-top-24 -right-18 absolute size-6 rounded-full p-0"
					>
						<X className="h-3 w-3" />
					</Button>
				</div>
			)}
			{/* Recording Button */}
			{isTranscribing ? (
				<Button
					ref={buttonRef}
					size="icon"
					variant="ghost"
					className="h-8 w-8 opacity-50"
					disabled
				>
					<Mic className="h-4 w-4" />
				</Button>
			) : isRecording ? (
				<Button
					ref={buttonRef}
					size="icon"
					onClick={handleStopRecording}
					variant="destructive"
					className="h-8 w-8 rounded-full"
				>
					<Square className="h-4 w-4" />
				</Button>
			) : (
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							ref={buttonRef}
							size="icon"
							variant="outline"
							onClick={handleStartRecording}
							className="flex size-8 items-center hover:bg-foreground/10 hover:dark:bg-muted"
						>
							<Mic className="h-4 w-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Dictate</p>
					</TooltipContent>
				</Tooltip>
			)}
		</div>
	);
}
