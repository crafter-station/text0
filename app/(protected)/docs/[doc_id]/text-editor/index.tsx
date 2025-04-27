"use client";

import { EditableDocumentName } from "@/components/editable-document-name";
import { InlineDiffView } from "@/components/inline-diff-view";
import { TextSelectionMenu } from "@/components/text-selection-menu";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import useDebouncedCallback from "@/hooks/use-debounced-callback";
import { useModel } from "@/hooks/use-model";
import { useSelectedReferences } from "@/hooks/use-selected-references";
import { TOUR_STEP_IDS } from "@/lib/tour-constants";
import { cn } from "@/lib/utils";
import { useCompletion } from "@ai-sdk/react";
import { Coffee, Sparkles } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import { DocTour } from "../tour";
import { AIChatSidebar } from "./ai-chat-sidebar";
import { ModelSelector } from "./model-selector";
import { TextToSpeech } from "./text-to-speech";
import { VoiceTranscription } from "./voice-transcription";

interface TextEditorProps {
	initialContent: string;
	documentId: string;
	initialName: string;
	updatedAt: string;
}

export function TextEditor({
	initialContent,
	documentId,
	initialName,
	updatedAt: initialUpdatedAt,
}: Readonly<TextEditorProps>) {
	const editorRef = React.useRef<HTMLTextAreaElement>(null);
	const [cursorPosition, setCursorPosition] = React.useState(0);
	const [isAutocompleteEnabled, setIsAutocompleteEnabled] =
		React.useState(true);
	const [isZenMode, setIsZenMode] = React.useState(false);

	const [updatedAt, setUpdatedAt] = React.useState(initialUpdatedAt);

	const [model] = useModel();
	const { getSelectedReferences } = useSelectedReferences(documentId);

	const { completion, input, setInput, handleSubmit, stop, setCompletion } =
		useCompletion({
			api: `/api/completion?model=${model}`,
			initialInput: initialContent,
			body: {
				references: getSelectedReferences(),
			},
		});

	const [selectedText, setSelectedText] = React.useState("");
	const [selectionPosition, setSelectionPosition] = React.useState<{
		x: number;
		y: number;
	} | null>(null);
	const [selectedRange, setSelectedRange] = React.useState<Range | null>(null);

	const [pendingUpdate, setPendingUpdate] = React.useState<string | null>(null);
	const [isTextLoading, setIsTextLoading] = useState(false);
	const [selectionStyles, setSelectionStyles] = useState<{
		backgroundColor: string;
		transition: string;
	} | null>(null);

	const [isModifying, setIsModifying] = useState(false);

	const [lastManualInput, setLastManualInput] = React.useState<string | null>(
		null,
	);

	const { complete } = useCompletion({
		api: "/api/text-modification",
		body: { model },
		onResponse: (response) => {
			if (!response.ok) throw new Error(response.statusText);
		},
		onFinish: () => {
			setIsModifying(false);
		},
		onError: (error) => {
			console.error("Error modifying text:", error);
			setIsModifying(false);
			setPendingUpdate(null);
		},
	});

	// Add debounced update function
	const debouncedUpdateContent = useDebouncedCallback(
		(documentId: string, content: string) => {
			fetch(`/api/docs/${documentId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ content }),
			}).then(() => {
				setUpdatedAt(new Date().toISOString());
			});
		},
		3000,
	);

	React.useEffect(() => {
		if (!isAutocompleteEnabled) {
			setCompletion("");
		}
	}, [isAutocompleteEnabled, setCompletion]);

	React.useEffect(() => {
		// Only trigger autocomplete if the input change came from manual typing
		// and the cursor is at the end of the text
		if (
			isAutocompleteEnabled &&
			input === lastManualInput &&
			cursorPosition === input.length
		) {
			const timer = setTimeout(() => {
				handleSubmit();
			}, 300);
			return () => clearTimeout(timer);
		}
	}, [
		handleSubmit,
		isAutocompleteEnabled,
		input,
		lastManualInput,
		cursorPosition,
	]);

	React.useEffect(() => {
		if (editorRef.current && cursorPosition === -1) {
			editorRef.current.selectionStart = editorRef.current.selectionEnd =
				input.length;
			setCursorPosition(input.length);
		}
	}, [input, cursorPosition]);

	// Handle zen mode toggle with keyboard shortcut
	React.useEffect(() => {
		const handleFullScreenChange = () => {
			if (isZenMode && !document.fullscreenElement) setIsZenMode(false);
		};

		const handleKeyPress = (e: KeyboardEvent) => {
			if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setIsZenMode((prev) => !prev);
				if (!isZenMode) {
					// Request full screen when entering zen mode
					document.documentElement.requestFullscreen().catch((err) => {
						console.log("Error attempting to enable full-screen mode:", err);
					});
				} else if (document.fullscreenElement) {
					// Exit full screen when leaving zen mode
					document.exitFullscreen().catch((err) => {
						console.log("Error attempting to exit full-screen mode:", err);
					});
				}
			}
		};

		window.addEventListener("keydown", handleKeyPress);
		window.addEventListener("fullscreenchange", handleFullScreenChange);
		return () => {
			window.removeEventListener("keydown", handleKeyPress);
			window.removeEventListener("fullscreenchange", handleFullScreenChange);
		};
	}, [isZenMode]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Tab" && completion) {
			e.preventDefault();
			const completionText = parseCompletion(completion, input);
			stop();
			setCompletion("");
			const newText =
				input.substring(0, cursorPosition) +
				completionText +
				input.substring(cursorPosition);
			setInput(newText);
			// Set cursor position to end of the inserted completion
			const newCursorPosition = cursorPosition + completionText.length;
			setCursorPosition(newCursorPosition);
			// Ensure the textarea cursor is also updated
			if (editorRef.current) {
				editorRef.current.selectionStart = newCursorPosition;
				editorRef.current.selectionEnd = newCursorPosition;
			}
		} else if (e.key === "Escape") {
			e.preventDefault();
			stop();
			setCompletion("");
			// Add this block to handle closing Zen Mode on Escape
			if (isZenMode) {
				setIsZenMode(false);
				if (document.fullscreenElement) {
					document.exitFullscreen().catch((err) => {
						console.log("Error attempting to exit full-screen mode:", err);
					});
				}
			}
		}
	};

	const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const newText = e.target.value;
		const newPosition = e.target.selectionStart;
		stop();
		setInput(newText);
		setLastManualInput(newText); // Track that this was a manual input
		setCursorPosition(newPosition);
		// Add debounced update
		debouncedUpdateContent(documentId, newText);
	};

	const handleSelectionChange = () => {
		if (editorRef.current) {
			const selection = window.getSelection();
			if (selection?.toString()) {
				const range = selection.getRangeAt(0);
				const selectedText = selection.toString();

				// Get textarea position and scroll
				const textareaRect = editorRef.current.getBoundingClientRect();
				const scrollTop = editorRef.current.scrollTop;

				// Get selection coordinates and full text
				const startCoords = getCaretCoordinates(
					editorRef.current,
					editorRef.current.selectionStart,
				);
				const fullText = editorRef.current.value;

				// Calculate line information
				const lines = fullText.split("\n");
				let currentPos = 0;
				let selectionStartLine = -1;
				let positionInLine = 0;

				// Find which line contains the selection start
				for (let i = 0; i < lines.length; i++) {
					const lineLength = lines[i].length + 1; // +1 for newline
					if (currentPos + lineLength > editorRef.current.selectionStart) {
						selectionStartLine = i;
						positionInLine = editorRef.current.selectionStart - currentPos;
						break;
					}
					currentPos += lineLength;
				}

				// Calculate average character width using a test span
				const testSpan = document.createElement("span");
				testSpan.style.font = getComputedStyle(editorRef.current).font;
				testSpan.style.visibility = "hidden";
				testSpan.style.position = "absolute";
				testSpan.textContent = selectedText;
				document.body.appendChild(testSpan);
				const charWidth = testSpan.offsetWidth / selectedText.length;
				document.body.removeChild(testSpan);

				// Calculate center based on character count and line position
				const MAX_CHARS = 98;
				const totalChars = selectedText.length;

				let effectiveLength: number;
				if (selectionStartLine >= 0) {
					const lineStartToSelection = positionInLine;
					if (lineStartToSelection > MAX_CHARS) {
						// If selection starts after line wrap, use modulo
						effectiveLength = lineStartToSelection % MAX_CHARS;
					} else if (totalChars > MAX_CHARS) {
						// If selection is longer than max chars, limit to max
						effectiveLength = MAX_CHARS;
					} else {
						// Otherwise use actual length
						effectiveLength = totalChars;
					}
				} else {
					effectiveLength = Math.min(totalChars, MAX_CHARS);
				}

				const selectionWidth = effectiveLength * charWidth;
				const centerX =
					textareaRect.left + startCoords.left + selectionWidth / 2;
				const y = textareaRect.top + startCoords.top - scrollTop;

				// Set selection styles
				setSelectionStyles({
					backgroundColor: "hsl(var(--primary) / 0.1)",
					transition: "background-color 0.2s ease",
				});

				// Store the range and text
				setSelectedRange(range.cloneRange());
				setSelectedText(selectedText);

				// Position menu at the exact center
				setSelectionPosition({
					x: centerX,
					y: y,
				});
			} else {
				setSelectedText("");
				setSelectionPosition(null);
				setSelectedRange(null);
				setSelectionStyles(null);
			}
		}
	};

	// Add helper function to calculate caret coordinates
	function getCaretCoordinates(element: HTMLTextAreaElement, position: number) {
		const div = document.createElement("div");
		const styles = getComputedStyle(element);
		const properties = [
			"fontFamily",
			"fontSize",
			"fontWeight",
			"wordWrap",
			"whiteSpace",
			"borderLeftWidth",
			"borderTopWidth",
			"borderRightWidth",
			"borderBottomWidth",
			"paddingLeft",
			"paddingTop",
			"paddingRight",
			"paddingBottom",
			"lineHeight",
		];

		for (const prop of properties) {
			// @ts-ignore
			div.style[prop] = styles[prop];
		}

		div.style.position = "absolute";
		div.style.top = "0";
		div.style.left = "0";
		div.style.visibility = "hidden";
		div.style.whiteSpace = "pre-wrap";

		const text = element.value.substring(0, position);
		div.textContent = text;

		const span = document.createElement("span");
		span.textContent = element.value.substring(position) || ".";
		div.appendChild(span);

		document.body.appendChild(div);
		const coordinates = {
			top:
				span.offsetTop +
				Number.parseInt(styles.borderTopWidth) +
				Number.parseInt(styles.paddingTop),
			left:
				span.offsetLeft +
				Number.parseInt(styles.borderLeftWidth) +
				Number.parseInt(styles.paddingLeft),
		};
		document.body.removeChild(div);

		return coordinates;
	}

	// Restore selection when dropdown opens
	const handleDropdownOpen = (open: boolean) => {
		if (open && selectedRange) {
			const selection = window.getSelection();
			selection?.removeAllRanges();
			selection?.addRange(selectedRange);
		}
	};

	const handleModifyText = (modifiedText: string) => {
		if (editorRef.current) {
			// Keep the selection and show loading state
			setIsTextLoading(true);
			setSelectionStyles({
				backgroundColor: "hsl(var(--primary) / 0.15)",
				transition: "background-color 0.3s ease",
			});

			// Show the streaming process in the selection
			setPendingUpdate(modifiedText);
		}
	};

	const handleModificationStart = async (instruction: string) => {
		setIsModifying(true);

		try {
			const stream = await complete(`${instruction}:\n\n${selectedText}`);

			if (stream) {
				setPendingUpdate(stream);
			}
		} catch (error) {
			console.error("Error in modification:", error);
			setIsModifying(false);
			setPendingUpdate(null);
		}
	};

	const handleVoiceTranscription = (text: string) => {
		if (!editorRef.current) return;

		// Insert text at current cursor position
		const startPos = editorRef.current.selectionStart;
		const endPos = editorRef.current.selectionEnd;
		const newText =
			input.substring(0, startPos) + text + input.substring(endPos);

		setInput(newText);
		setLastManualInput(newText);

		// Update cursor position after the inserted text
		const newCursorPosition = startPos + text.length;
		setCursorPosition(newCursorPosition);

		// Update the textarea cursor position
		if (editorRef.current) {
			editorRef.current.selectionStart = newCursorPosition;
			editorRef.current.selectionEnd = newCursorPosition;
			editorRef.current.focus();
		}

		// Save changes
		debouncedUpdateContent(documentId, newText);
	};

	const displayedCompletion = parseCompletion(completion, input);

	return (
		<div className="relative flex h-full w-full bg-background">
			<DocTour />
			{/* Background Image */}
			<Image
				src="/bghero.webp"
				alt="Light ray background"
				width={2048}
				height={2048}
				className="-top-20 pointer-events-none absolute right-0 left-0 z-0 mx-auto hidden h-full w-full select-none md:block"
				priority
			/>
			<div
				id={TOUR_STEP_IDS.TEXT_EDITOR}
				className={cn(
					"relative flex flex-1 flex-col",
					isZenMode ? "fixed inset-0 z-50 bg-background/95" : "pr-0",
				)}
			>
				{/* Decorative gradients - only show when modifying */}
				{isModifying && (
					<>
						<div
							className="pointer-events-none absolute top-1/4 left-[15%] h-[400px] w-[400px] animate-float-slow"
							style={{
								background:
									"radial-gradient(circle at center,var(--primary) 0%, transparent 70%)",
								opacity: 0.15,
								filter: "blur(60px)",
							}}
						/>
						<div
							className="pointer-events-none absolute right-[15%] bottom-1/3 h-[350px] w-[350px] animate-float"
							style={{
								background:
									"radial-gradient(circle at center, var(--primary) 0%, transparent 70%)",
								opacity: 0.12,
								filter: "blur(50px)",
							}}
						/>
					</>
				)}

				<div className="flex h-full justify-center py-8">
					<div className={cn("flex h-full w-full max-w-4xl flex-col")}>
						{/* Add EditableDocumentName component */}
						<EditableDocumentName
							documentId={documentId}
							initialName={initialName}
							setUpdatedAt={setUpdatedAt}
						/>
						<div className="mb-2 px-8 text-muted-foreground text-xs">
							Updated at: {new Date(updatedAt).toLocaleString()}
						</div>
						<div className="relative h-[calc(100%-2rem)] w-full flex-1">
							<textarea
								ref={editorRef}
								value={input}
								onChange={handleInput}
								onKeyDown={handleKeyDown}
								onSelect={handleSelectionChange}
								onMouseUp={handleSelectionChange}
								placeholder="Start writing..."
								className={cn(
									"h-[calc(100%-2rem)] w-full flex-1 resize-none whitespace-pre-wrap bg-transparent px-8 font-serif text-base outline-none placeholder:text-muted-foreground/50",
									isZenMode && "px-4 leading-relaxed",
									pendingUpdate && "opacity-0",
									isTextLoading && "selection:bg-primary/20",
									isModifying && "opacity-70",
								)}
								style={{
									caretColor: "var(--primary)",
									...(selectionStyles && {
										"::selection": selectionStyles,
										"::MozSelection": selectionStyles,
									}),
								}}
							/>
							{isAutocompleteEnabled &&
								displayedCompletion &&
								!pendingUpdate && (
									<div
										aria-hidden="true"
										className={cn(
											"pointer-events-none absolute top-0 right-0 left-0 h-full w-full flex-1 whitespace-pre-wrap font-serif",
											isZenMode
												? "px-4 leading-relaxed opacity-30"
												: "w-full px-8 text-base opacity-50",
											isModifying &&
												"after:absolute after:inset-0 after:animate-shine after:bg-gradient-to-r after:from-transparent after:via-primary/10 after:to-transparent",
										)}
									>
										<span className="whitespace-pre-wrap">
											{input.substring(0, cursorPosition)}
											<span
												className={cn(
													"text-muted-foreground",
													isModifying && "animate-pulse",
												)}
											>
												{displayedCompletion}
											</span>
											{input.substring(cursorPosition)}
										</span>
									</div>
								)}
							{pendingUpdate && (
								<div className="absolute inset-0 flex flex-col">
									<div
										className={cn(
											"absolute top-0 right-0 left-0 h-full w-full flex-1 font-serif",
											isZenMode
												? "px-4 text-xl leading-relaxed"
												: "px-8 text-lg",
										)}
									>
										<div className="whitespace-pre-wrap">
											<span>
												{input.substring(
													0,
													editorRef.current?.selectionStart ?? 0,
												)}
											</span>

											<InlineDiffView
												originalText={selectedText}
												newText={pendingUpdate}
												className="relative inline"
												onAccept={() => {
													if (editorRef.current) {
														const start = editorRef.current.selectionStart;
														const end = editorRef.current.selectionEnd;
														const newText =
															input.substring(0, start) +
															pendingUpdate +
															input.substring(end);

														// Clean up all states at once
														setInput(newText);
														// Don't update lastManualInput here since this isn't manual input
														setPendingUpdate(null);
														setIsModifying(false);
														setCompletion("");
														setSelectionPosition(null);
														setSelectedText("");
														setSelectedRange(null);
														setSelectionStyles(null);

														// Reset cursor position
														const newPosition =
															start + (pendingUpdate?.length || 0);
														setCursorPosition(newPosition);
														if (editorRef.current) {
															editorRef.current.selectionStart = newPosition;
															editorRef.current.selectionEnd = newPosition;
														}
													}
												}}
												onReject={() => {
													setPendingUpdate(null);
													setIsModifying(false);
												}}
											/>

											<span>
												{input.substring(editorRef.current?.selectionEnd ?? 0)}
											</span>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Floating Bottom Bar - Only show when not in Zen mode */}
				{!isZenMode && (
					<div
						id={TOUR_STEP_IDS.ACTION_BAR}
						className="-translate-x-1/2 absolute bottom-4 left-1/2 z-10 flex w-full max-w-[22rem] items-center justify-center px-4"
					>
						<div className="flex w-full flex-col items-center justify-center rounded-lg border bg-background/80 shadow-sm backdrop-blur-sm">
							<div className="flex w-full items-center justify-center gap-x-4 px-4 py-2">
								<Tooltip>
									<TooltipTrigger asChild>
										<div>
											<Toggle
												id="autocomplete"
												variant="outline"
												className="size-8 hover:bg-foreground/10 data-[state=on]:hover:bg-foreground/10 hover:dark:bg-muted data-[state=on]:dark:hover:bg-accent/70"
												key={isAutocompleteEnabled ? "true" : "false"}
												pressed={isAutocompleteEnabled}
												onPressedChange={setIsAutocompleteEnabled}
											>
												<Sparkles className="size-3.5" />
											</Toggle>
										</div>
									</TooltipTrigger>
									<TooltipContent>
										<p>Toggle AI Autocomplete</p>
									</TooltipContent>
								</Tooltip>

								<TextToSpeech selectedText={selectedText} />

								<VoiceTranscription
									onTranscriptionComplete={handleVoiceTranscription}
								/>

								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="outline"
											size="icon"
											className="flex size-8 items-center hover:bg-foreground/10 hover:dark:bg-muted"
											onClick={() => {
												setIsZenMode((prev) => !prev);
												if (!isZenMode) {
													// Request full screen when clicking the button
													document.documentElement
														.requestFullscreen()
														.catch((err) => {
															console.log(
																"Error attempting to enable full-screen mode:",
																err,
															);
														});
												} else if (document.fullscreenElement) {
													// Exit full screen when leaving zen mode
													document.exitFullscreen().catch((err) => {
														console.log(
															"Error attempting to exit full-screen mode:",
															err,
														);
													});
												}
											}}
										>
											<Coffee className="size-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										<p>
											<kbd className="inline-flex h-5 max-h-full items-center rounded border bg-muted px-1 font-medium font-mono text-[0.625rem] text-foreground">
												⌘J
											</kbd>{" "}
											Toggle Zen Mode
										</p>
									</TooltipContent>
								</Tooltip>

								<ModelSelector />
							</div>
						</div>
					</div>
				)}
			</div>

			<div className="group/sidebar-wrapper has-[data-side=right]:ml-0">
				<AIChatSidebar
					content={input}
					isEnabled={isAutocompleteEnabled}
					onPendingUpdate={setPendingUpdate}
				/>
			</div>

			{/* Text Selection Menu */}
			{selectedText && selectionPosition && !isZenMode && (
				<div
					className="fixed z-[100]"
					style={{
						left: `${selectionPosition.x}px`,
						top: `${selectionPosition.y}px`,
						transform: "translate(-50%, 0)",
					}}
				>
					<TextSelectionMenu
						selectedText={selectedText}
						onModify={handleModifyText}
						model={model}
						onPendingUpdate={setPendingUpdate}
						onOpenChange={handleDropdownOpen}
						isLoading={isModifying}
						onModificationStart={handleModificationStart}
					/>
				</div>
			)}
		</div>
	);
}

function parseCompletion(completion: string | undefined, input: string) {
	if (!completion) return "";
	const startTag = "<completion>";
	const endTag = "</completion>";
	if (completion.startsWith(startTag) && completion.includes(endTag)) {
		const startIndex = startTag.length;
		const endIndex = completion.indexOf(endTag);
		let result = completion.substring(startIndex, endIndex);

		// Handle space after input
		if (input.endsWith(" ") && result.startsWith(" ")) {
			result = result.trimStart();
		}

		// Remove spaces at the start of each new line
		result = result
			.split("\n")
			.map((line) => {
				// If line is only whitespace, return empty string
				if (line.trim() === "") {
					return "";
				}
				// If line starts with multiple spaces/tabs (likely code indentation), preserve it
				if (RegExp(/^[\t ]{2,}/).exec(line)) {
					return line;
				}
				// Otherwise remove leading whitespace
				return line.trimStart();
			})
			.join("\n");

		return result;
	}
	return "";
}
