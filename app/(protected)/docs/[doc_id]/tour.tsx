"use client";

import { TextSelectionMenu } from "@/components/text-selection-menu";
import { TourAlertDialog, useTour } from "@/components/tour";
import type { TourStep } from "@/components/tour";
import { TOUR_STEP_IDS } from "@/lib/tour-constants";
import { Check, Coffee, Sparkles, Volume2, Wand2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const DOC_TOUR_STEPS: TourStep[] = [
	{
		content: (
			<div className="space-y-3">
				<h3 className="font-semibold text-base">Text Editor</h3>
				<p>
					This is your document editor where you can write and format your
					content.
				</p>
				<div className="mt-3 rounded-md border bg-muted/50 p-3">
					<div className="mb-2 flex items-center gap-2">
						<Wand2 className="h-4 w-4 text-primary" />
						<span className="font-medium text-sm">Text Selection Magic</span>
					</div>
					<p className="mb-3 text-muted-foreground text-sm">
						Select any text in your document to reveal this powerful enhancement
						menu:
					</p>
					<div className="relative flex justify-center overflow-visible rounded border bg-background/80 p-2">
						<div className="demo-menu-wrapper">
							{/* Mock selected text with styling */}
							<div className="rounded bg-primary/50 px-3 py-1 text-sm">
								Example selected text
							</div>
							{/* Key features highlight */}
							<div className="fade-in absolute top-[45px] right-0 z-20 w-[220px] animate-in rounded-md border bg-popover p-2 text-xs shadow-md">
								<div className="flex items-center gap-1.5 px-2 py-1.5 text-foreground">
									<Sparkles className="h-3.5 w-3.5 text-primary" />
									<span>Improve writing</span>
								</div>
								<div className="flex items-center gap-1.5 px-2 py-1.5 text-foreground">
									<Check className="h-3.5 w-3.5 text-green-500" />
									<span>Fix grammar</span>
								</div>
							</div>
							{/* The actual menu component */}
							<TextSelectionMenu
								selectedText="Example selected text"
								onModify={() => {}}
								model="gpt-4"
								onPendingUpdate={() => {}}
								onOpenChange={() => {}}
								isLoading={false}
								onModificationStart={async () => {}}
							/>
						</div>
					</div>
					<p className="mt-3 flex flex-col gap-1 text-muted-foreground text-xs">
						<span>
							• Quickly improve writing, fix grammar, adjust tone, and more
						</span>
						<span>
							• Use <kbd className="rounded bg-muted px-1 py-0.5">⌘I</kbd> to
							improve text,{" "}
							<kbd className="rounded bg-muted px-1 py-0.5">⌘G</kbd> for grammar
							fixes
						</span>
					</p>
				</div>
			</div>
		),
		selectorId: TOUR_STEP_IDS.TEXT_EDITOR,
		position: "top",
	},
	{
		content: (
			<div className="space-y-3">
				<h3 className="font-semibold text-base">Action Bar</h3>
				<div className="mt-2 flex flex-col gap-2">
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted">
							<Sparkles className="h-3.5 w-3.5 text-primary" />
						</div>
						<span className="text-sm">Toggle AI autocomplete suggestions</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted">
							<Volume2 className="h-3.5 w-3.5 text-blue-400" />
						</div>
						<span className="text-sm">Text-to-speech for any selection</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted">
							<Coffee className="h-3.5 w-3.5" />
						</div>
						<span className="text-sm">
							Enter Zen mode
							<kbd className="ml-1 inline-flex h-5 items-center rounded border bg-muted px-1 font-mono text-[10px]">
								⌘J
							</kbd>
						</span>
					</div>
				</div>
			</div>
		),
		selectorId: TOUR_STEP_IDS.ACTION_BAR,
		position: "top",
	},
	{
		content: (
			<div className="space-y-2">
				<h3 className="font-semibold text-base">AI Assistant</h3>
				<p>Toggle the AI assistant panel to get help with your writing.</p>
			</div>
		),
		selectorId: TOUR_STEP_IDS.AI_SIDEBAR_TOGGLE,
		position: "left",
	},
	{
		content: (
			<div className="space-y-2">
				<h3 className="font-semibold text-base">References</h3>
				<p>
					Select reference materials for the AI to use when responding to your
					questions or completions in the Text Editor.
				</p>
			</div>
		),
		selectorId: TOUR_STEP_IDS.AI_REFERENCES,
		position: "left",
	},
	{
		content: (
			<div className="space-y-2">
				<h3 className="font-semibold text-base">Chat with AI</h3>
				<p>
					Ask questions about your document or get help with writing and
					editing.
				</p>
			</div>
		),
		selectorId: TOUR_STEP_IDS.AI_CHAT_INPUT,
		position: "top",
	},
];

export function DocTour() {
	const { setSteps, setIsTourCompleted, isTourCompleted } = useTour();
	const [openTour, setOpenTour] = useState(false);
	const searchParams = useSearchParams();

	// Get navigation source if available
	const from = searchParams.get("from");

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		// Set tour steps
		setSteps(DOC_TOUR_STEPS);

		// Check localStorage first
		let isCompleted = false;
		try {
			const completedStatus = localStorage.getItem("tour-completed-doc");
			isCompleted = completedStatus === "true";
		} catch (error) {
			console.error("Error reading from localStorage:", error);
		}

		// Only show tour if not completed and either:
		// 1. We're navigating from another page (isNavigated is true)
		// 2. This is a direct load/refresh (no from parameter)
		if (!isCompleted) {
			// Show tour dialog after a short delay
			setIsTourCompleted(false);
			const timer = setTimeout(() => {
				setOpenTour(true);
			}, 1000);

			return () => clearTimeout(timer);
		}
	}, [setSteps]);

	return (
		<TourAlertDialog
			isOpen={openTour}
			setIsOpen={setOpenTour}
			title="Welcome to the Document Editor"
			description="Let's explore the document editor features to help you get the most out of text0."
		/>
	);
}
