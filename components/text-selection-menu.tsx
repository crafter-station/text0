"use client";

import React, { useEffect, useState } from "react";
import {
	Menubar,
	MenubarContent,
	MenubarItem,
	MenubarMenu,
	MenubarSeparator,
	MenubarTrigger,
	MenubarSub,
	MenubarSubContent,
	MenubarSubTrigger,
	MenubarShortcut,
	MenubarRadioGroup,
	MenubarRadioItem,
} from "@/components/ui/menubar";
import {
	Wand2,
	Sparkles,
	Check,
	Minimize2,
	Maximize2,
	Languages,
	MessageSquare,
	Pencil,
	Palette,
	Type,
	Baseline,
	Lightbulb,
	Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TextSelectionMenuProps {
	selectedText: string;
	onModify: (text: string) => void;
	model: string;
	onPendingUpdate: (update: string | null) => void;
	onOpenChange?: (open: boolean) => void;
	isLoading?: boolean;
	onModificationStart: (instruction: string) => Promise<void>;
}

export function TextSelectionMenu({
	selectedText,
	onModify,
	model,
	onPendingUpdate,
	onOpenChange,
	isLoading,
	onModificationStart,
}: TextSelectionMenuProps) {
	const [position, setPosition] = useState({ top: 0, left: 0 });
	const [selectedTone, setSelectedTone] = useState("professional");
	const [activeItem, setActiveItem] = useState<string | null>(null);

	useEffect(() => {
		const updatePosition = () => {
			const selection = window.getSelection();
			if (selection && selection.rangeCount > 0) {
				const range = selection.getRangeAt(0);
				const rect = range.getBoundingClientRect();
				const scrollX = window.scrollX || window.pageXOffset;
				const scrollY = window.scrollY || window.pageYOffset;
				setPosition({
					top: rect.top + scrollY - 10,
					left: rect.left + scrollX + rect.width / 2,
				});
			}
		};

		updatePosition();
		window.addEventListener("resize", updatePosition);
		return () => window.removeEventListener("resize", updatePosition);
	}, []);

	const handleModification = async (instruction: string, itemId: string) => {
		try {
			setActiveItem(itemId);
			onPendingUpdate(null);
			await onModificationStart(instruction);
		} catch (error) {
			console.error("Error in text modification:", error);
			onPendingUpdate(null);
			setActiveItem(null);
		}
	};

	const LoadingSpinner = () => (
		<Loader2 className="w-4 h-4 animate-spin ml-auto" />
	);

	return (
		<div
			className="fixed z-50 w-fit bg-transparent"
			style={{
				top: `${position.top}px`,
				left: `${position.left}px`,
				transform: "translate(-50%, -100%)",
			}}
		>
			<Menubar>
				<MenubarMenu>
					<MenubarTrigger className="gap-2 data-[state=open]:bg-accent">
						<Wand2
							className={cn(
								"w-4 h-4",
								isLoading && "animate-pulse text-primary",
							)}
						/>
						<span className="text-sm font-medium">Enhance</span>
					</MenubarTrigger>
					<MenubarContent
						className="animate-in fade-in-0 zoom-in-95"
						align="start"
					>
						<MenubarItem
							onClick={() =>
								handleModification(
									"Enhance this text while preserving its core message. Focus on clarity, conciseness, and professional tone",
									"improve",
								)
							}
							className="gap-2 cursor-pointer relative group"
							disabled={isLoading}
						>
							<Sparkles className="w-4 h-4 text-primary" />
							<span>Improve writing</span>
							{activeItem === "improve" ? (
								<LoadingSpinner />
							) : (
								<MenubarShortcut>⌘I</MenubarShortcut>
							)}
						</MenubarItem>

						<MenubarItem
							onClick={() =>
								handleModification(
									"Fix any grammatical errors, spelling mistakes, and punctuation issues",
									"grammar",
								)
							}
							className="gap-2 cursor-pointer relative group"
							disabled={isLoading}
						>
							<Check className="w-4 h-4 text-green-500" />
							<span>Fix grammar & spelling</span>
							{activeItem === "grammar" ? (
								<LoadingSpinner />
							) : (
								<MenubarShortcut>⌘G</MenubarShortcut>
							)}
						</MenubarItem>

						<MenubarSeparator />

						<MenubarSub>
							<MenubarSubTrigger className="gap-2">
								<Type className="w-4 h-4 text-blue-500" />
								<span>Adjust length</span>
							</MenubarSubTrigger>
							<MenubarSubContent>
								<MenubarItem
									onClick={() =>
										handleModification(
											"Make this text more concise while retaining all key information",
											"shorter",
										)
									}
									disabled={isLoading}
								>
									<Minimize2 className="w-4 h-4 mr-2" />
									Make shorter
									{activeItem === "shorter" && <LoadingSpinner />}
								</MenubarItem>
								<MenubarItem
									onClick={() =>
										handleModification(
											"Expand this text with relevant details and examples",
											"longer",
										)
									}
									disabled={isLoading}
								>
									<Maximize2 className="w-4 h-4 mr-2" />
									Make longer
									{activeItem === "longer" && <LoadingSpinner />}
								</MenubarItem>
							</MenubarSubContent>
						</MenubarSub>

						<MenubarSub>
							<MenubarSubTrigger className="gap-2">
								<Palette className="w-4 h-4 text-violet-500" />
								<span>Change tone</span>
							</MenubarSubTrigger>
							<MenubarSubContent>
								<MenubarRadioGroup
									value={selectedTone}
									onValueChange={setSelectedTone}
								>
									<MenubarRadioItem
										value="professional"
										onClick={() =>
											handleModification(
												"Make the tone more professional and formal",
												"tone-professional",
											)
										}
										className="gap-2"
										disabled={isLoading}
									>
										<Baseline className="w-4 h-4 mr-2" />
										Professional
										{activeItem === "tone-professional" && <LoadingSpinner />}
									</MenubarRadioItem>
									<MenubarRadioItem
										value="casual"
										onClick={() =>
											handleModification(
												"Make the tone more casual and conversational",
												"tone-casual",
											)
										}
										className="gap-2"
										disabled={isLoading}
									>
										<Pencil className="w-4 h-4 mr-2" />
										Casual
										{activeItem === "tone-casual" && <LoadingSpinner />}
									</MenubarRadioItem>
									<MenubarRadioItem
										value="confident"
										onClick={() =>
											handleModification(
												"Make the tone more confident and assertive",
												"tone-confident",
											)
										}
										className="gap-2"
										disabled={isLoading}
									>
										<Lightbulb className="w-4 h-4 mr-2" />
										Confident
										{activeItem === "tone-confident" && <LoadingSpinner />}
									</MenubarRadioItem>
								</MenubarRadioGroup>
							</MenubarSubContent>
						</MenubarSub>

						<MenubarSeparator />

						<MenubarItem
							onClick={() =>
								handleModification(
									"Simplify this text to make it more accessible. Use clearer language",
									"simplify",
								)
							}
							className="gap-2 cursor-pointer"
							disabled={isLoading}
						>
							<Languages className="w-4 h-4 text-yellow-500" />
							<span>Simplify language</span>
							{activeItem === "simplify" && <LoadingSpinner />}
						</MenubarItem>

						<MenubarItem
							onClick={() =>
								handleModification(
									"Create a clear and concise summary of this text",
									"summarize",
								)
							}
							className="gap-2 cursor-pointer"
							disabled={isLoading}
						>
							<MessageSquare className="w-4 h-4 text-teal-500" />
							<span>Summarize</span>
							{activeItem === "summarize" ? (
								<LoadingSpinner />
							) : (
								<MenubarShortcut>⌘S</MenubarShortcut>
							)}
						</MenubarItem>
					</MenubarContent>
				</MenubarMenu>
			</Menubar>
		</div>
	);
}
