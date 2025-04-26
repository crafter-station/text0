"use client";

import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";

import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InvertedT0Logo } from "./ui/icons/t0-logo";

export interface TourStep {
	content: React.ReactNode;
	selectorId: string;
	width?: number;
	height?: number;
	onClickWithinArea?: () => void;
	position?: "top" | "bottom" | "left" | "right";
}

interface TourContextType {
	currentStep: number;
	totalSteps: number;
	nextStep: () => void;
	previousStep: () => void;
	endTour: () => void;
	isActive: boolean;
	startTour: () => void;
	setSteps: (steps: TourStep[]) => void;
	steps: TourStep[];
	isTourCompleted: boolean;
	setIsTourCompleted: (completed: boolean) => void;
}

interface TourProviderProps {
	children: React.ReactNode;
	onComplete?: () => void;
	className?: string;
	isTourCompleted?: boolean;
}

const TourContext = createContext<TourContextType | null>(null);

const PADDING = 16;
const CONTENT_WIDTH = 300;
const CONTENT_HEIGHT = 200;

function getElementPosition(id: string) {
	const element = document.getElementById(id);
	if (!element) return null;
	const rect = element.getBoundingClientRect();
	return {
		top: rect.top + window.scrollY,
		left: rect.left + window.scrollX,
		width: rect.width,
		height: rect.height,
	};
}

function calculateContentPosition(
	elementPos: { top: number; left: number; width: number; height: number },
	position: "top" | "bottom" | "left" | "right" = "bottom",
) {
	const viewportWidth = window.innerWidth;
	const viewportHeight = window.innerHeight;

	let left = elementPos.left;
	let top = elementPos.top;

	switch (position) {
		case "top":
			top = elementPos.top - CONTENT_HEIGHT - PADDING;
			left = elementPos.left + elementPos.width / 2 - CONTENT_WIDTH / 2;
			break;
		case "bottom":
			top = elementPos.top + elementPos.height + PADDING;
			left = elementPos.left + elementPos.width / 2 - CONTENT_WIDTH / 2;
			break;
		case "left":
			left = elementPos.left - CONTENT_WIDTH - PADDING;
			top = elementPos.top + elementPos.height / 2 - CONTENT_HEIGHT / 2;
			break;
		case "right":
			left = elementPos.left + elementPos.width + PADDING;
			top = elementPos.top + elementPos.height / 2 - CONTENT_HEIGHT / 2;
			break;
	}

	return {
		top: Math.max(
			PADDING,
			Math.min(top, viewportHeight - CONTENT_HEIGHT - PADDING),
		),
		left: Math.max(
			PADDING,
			Math.min(left, viewportWidth - CONTENT_WIDTH - PADDING),
		),
		width: CONTENT_WIDTH,
		height: CONTENT_HEIGHT,
	};
}

export function TourProvider({
	children,
	onComplete,
	className,
	isTourCompleted = false,
}: TourProviderProps) {
	const [steps, setSteps] = useState<TourStep[]>([]);
	const [currentStep, setCurrentStep] = useState(-1);
	const [elementPosition, setElementPosition] = useState<{
		top: number;
		left: number;
		width: number;
		height: number;
	} | null>(null);
	const [isCompleted, setIsCompleted] = useState(isTourCompleted);

	// Load completed tour status from localStorage on component mount
	useEffect(() => {
		// Check localStorage
		try {
			// Get the current pathname to identify the tour
			const pathname = window.location.pathname;
			const tourType = pathname.includes("/docs/") ? "doc" : "home";
			const isTourCompletedLocally = localStorage.getItem(
				`tour-completed-${tourType}`,
			);

			if (isTourCompletedLocally === "true") {
				setIsCompleted(true);
			}
		} catch (error) {
			// Ignore localStorage errors
			console.error("Error accessing localStorage:", error);
		}
	}, []);

	const updateElementPosition = useCallback(() => {
		if (currentStep >= 0 && currentStep < steps.length) {
			const position = getElementPosition(steps[currentStep]?.selectorId ?? "");
			if (position) {
				setElementPosition(position);
			}
		}
	}, [currentStep, steps]);

	useEffect(() => {
		updateElementPosition();
		window.addEventListener("resize", updateElementPosition);
		window.addEventListener("scroll", updateElementPosition);

		return () => {
			window.removeEventListener("resize", updateElementPosition);
			window.removeEventListener("scroll", updateElementPosition);
		};
	}, [updateElementPosition]);

	const nextStep = useCallback(async () => {
		setCurrentStep((prev) => {
			if (prev >= steps.length - 1) {
				return -1;
			}
			return prev + 1;
		});

		if (currentStep === steps.length - 1) {
			// Save completion status to localStorage
			try {
				const pathname = window.location.pathname;
				const tourType = pathname.includes("/docs/") ? "doc" : "home";
				localStorage.setItem(`tour-completed-${tourType}`, "true");
			} catch (error) {
				console.error("Error saving to localStorage:", error);
			}

			setIsTourCompleted(true);
			onComplete?.();
		}
	}, [steps.length, onComplete, currentStep]);

	const previousStep = useCallback(() => {
		setCurrentStep((prev) => (prev > 0 ? prev - 1 : prev));
	}, []);

	const endTour = useCallback(() => {
		setCurrentStep(-1);
	}, []);

	const startTour = useCallback(() => {
		if (isCompleted) {
			return;
		}
		setCurrentStep(0);
	}, [isCompleted]);

	const handleClick = useCallback(
		(e: MouseEvent) => {
			if (
				currentStep >= 0 &&
				elementPosition &&
				steps[currentStep]?.onClickWithinArea
			) {
				const clickX = e.clientX + window.scrollX;
				const clickY = e.clientY + window.scrollY;

				const isWithinBounds =
					clickX >= elementPosition.left &&
					clickX <=
						elementPosition.left +
							(steps[currentStep]?.width || elementPosition.width) &&
					clickY >= elementPosition.top &&
					clickY <=
						elementPosition.top +
							(steps[currentStep]?.height || elementPosition.height);

				if (isWithinBounds) {
					steps[currentStep].onClickWithinArea?.();
				}
			}
		},
		[currentStep, elementPosition, steps],
	);

	useEffect(() => {
		window.addEventListener("click", handleClick);
		return () => {
			window.removeEventListener("click", handleClick);
		};
	}, [handleClick]);

	const setIsTourCompleted = useCallback((completed: boolean) => {
		setIsCompleted(completed);
		// Save to localStorage when completed manually
		if (completed) {
			try {
				const pathname = window.location.pathname;
				const tourType = pathname.includes("/docs/") ? "doc" : "home";
				localStorage.setItem(`tour-completed-${tourType}`, "true");
			} catch (error) {
				console.error("Error saving to localStorage:", error);
			}
		}
	}, []);

	return (
		<TourContext.Provider
			value={{
				currentStep,
				totalSteps: steps.length,
				nextStep,
				previousStep,
				endTour,
				isActive: currentStep >= 0,
				startTour,
				setSteps,
				steps,
				isTourCompleted: isCompleted,
				setIsTourCompleted,
			}}
		>
			{children}
			<AnimatePresence>
				{currentStep >= 0 && elementPosition && (
					<>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="absolute inset-0 z-50 overflow-hidden bg-black/50"
							style={{
								clipPath: `polygon(
                  0% 0%,                                                                          /* top-left */
                  0% 100%,                                                                        /* bottom-left */
                  100% 100%,                                                                      /* bottom-right */
                  100% 0%,                                                                        /* top-right */
                  
                  /* Create rectangular hole */
                  ${elementPosition.left}px 0%,                                                   /* top edge start */
                  ${elementPosition.left}px ${elementPosition.top}px,                             /* hole top-left */
                  ${elementPosition.left + (steps[currentStep]?.width || elementPosition.width)}px ${elementPosition.top}px,  /* hole top-right */
                  ${elementPosition.left + (steps[currentStep]?.width || elementPosition.width)}px ${elementPosition.top + (steps[currentStep]?.height || elementPosition.height)}px,  /* hole bottom-right */
                  ${elementPosition.left}px ${elementPosition.top + (steps[currentStep]?.height || elementPosition.height)}px,  /* hole bottom-left */
                  ${elementPosition.left}px 0%                                                    /* back to top edge */
                )`,
							}}
						/>
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							style={{
								position: "absolute",
								top: elementPosition.top,
								left: elementPosition.left,
								width: steps[currentStep]?.width || elementPosition.width,
								height: steps[currentStep]?.height || elementPosition.height,
							}}
							className={cn(
								"z-[100] border-2 border-muted-foreground",
								className,
							)}
						/>

						<motion.div
							initial={{ opacity: 0, y: 10, top: 50, right: 50 }}
							animate={{
								opacity: 1,
								y: 0,
								top: calculateContentPosition(
									elementPosition,
									steps[currentStep]?.position,
								).top,
								left: calculateContentPosition(
									elementPosition,
									steps[currentStep]?.position,
								).left,
							}}
							transition={{
								duration: 0.8,
								ease: [0.16, 1, 0.3, 1],
								opacity: { duration: 0.4 },
							}}
							exit={{ opacity: 0, y: 10 }}
							style={{
								position: "absolute",
								width: calculateContentPosition(
									elementPosition,
									steps[currentStep]?.position,
								).width,
							}}
							className="relative z-[100] rounded-lg border bg-background p-4 shadow-lg"
						>
							<div className="absolute top-4 right-4 text-muted-foreground text-xs">
								{currentStep + 1} / {steps.length}
							</div>
							<AnimatePresence mode="wait">
								<div>
									<motion.div
										key={`tour-content-${currentStep}`}
										initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
										animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
										exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
										className="overflow-hidden"
										transition={{
											duration: 0.2,
											height: {
												duration: 0.4,
											},
										}}
									>
										{steps[currentStep]?.content}
									</motion.div>
									<div className="mt-4 flex justify-between">
										{currentStep > 0 && (
											<button
												type="button"
												onClick={previousStep}
												disabled={currentStep === 0}
												className="text-muted-foreground text-sm hover:text-foreground"
											>
												Previous
											</button>
										)}
										<button
											type="button"
											onClick={nextStep}
											className="ml-auto font-medium text-primary text-sm hover:text-primary/90"
										>
											{currentStep === steps.length - 1 ? "Finish" : "Next"}
										</button>
									</div>
								</div>
							</AnimatePresence>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</TourContext.Provider>
	);
}

export function useTour() {
	const context = useContext(TourContext);
	if (!context) {
		throw new Error("useTour must be used within a TourProvider");
	}
	return context;
}

export function TourAlertDialog({
	isOpen,
	setIsOpen,
	title = "Welcome to text0",
	description = "Let's explore the home page together. This is your starting point for everything.",
}: {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	title?: string;
	description?: string;
}) {
	const { startTour, steps, isTourCompleted, currentStep, setIsTourCompleted } =
		useTour();

	if (isTourCompleted || steps.length === 0 || currentStep > -1) {
		return null;
	}

	const handleSkip = async () => {
		setIsOpen(false);
		// Mark tour as completed when skipped
		setIsTourCompleted(true);
	};

	return (
		<AlertDialog open={isOpen}>
			<AlertDialogContent className="max-w-md p-6">
				<AlertDialogHeader className="flex flex-col items-center justify-center">
					<div className="relative mb-4">
						<motion.div
							initial={{ scale: 0.7, filter: "blur(10px)" }}
							animate={{
								scale: 1,
								filter: "blur(0px)",
								y: [0, -8, 0],
								rotate: [42, 48, 42],
							}}
							transition={{
								duration: 0.4,
								ease: "easeOut",
								y: {
									duration: 2.5,
									repeat: Number.POSITIVE_INFINITY,
									ease: "easeInOut",
								},
								rotate: {
									duration: 3,
									repeat: Number.POSITIVE_INFINITY,
									ease: "easeInOut",
								},
							}}
						>
							<InvertedT0Logo className="size-16 stroke-1 text-primary" />
						</motion.div>
					</div>
					<AlertDialogTitle className="text-center font-medium text-xl">
						{title}
					</AlertDialogTitle>
					<AlertDialogDescription className="mt-2 text-center text-muted-foreground text-sm">
						{description}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="mt-3 space-y-3">
					<Button onClick={startTour} className="w-full">
						Start Tour
					</Button>
					<Button onClick={handleSkip} variant="ghost" className="w-full">
						Skip Tour
					</Button>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	);
}
