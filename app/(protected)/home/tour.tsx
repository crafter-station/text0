"use client";

import { TourAlertDialog, useTour } from "@/components/tour";
import type { TourStep } from "@/components/tour";
import { TOUR_STEP_IDS } from "@/lib/tour-constants";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const HOME_TOUR_STEPS: TourStep[] = [
	{
		content: (
			<div className="space-y-2">
				<h3 className="font-semibold text-base">Create New Documents</h3>
				<p>
					Create a new document to start writing and organizing your thoughts.
				</p>
			</div>
		),
		selectorId: TOUR_STEP_IDS.NEW_DOC,
		position: "bottom",
	},
	{
		content: (
			<div className="space-y-2">
				<h3 className="font-semibold text-base">Add Memories</h3>
				<p>Upload memories that can be used by your AI assistant.</p>
			</div>
		),
		selectorId: TOUR_STEP_IDS.NEW_MEMORY,
		position: "bottom",
	},
	{
		content: (
			<div className="space-y-2">
				<h3 className="font-semibold text-base">Search</h3>
				<p>Quickly search for documents and other content in your workspace.</p>
			</div>
		),
		selectorId: TOUR_STEP_IDS.SEARCH_COMMAND,
		position: "bottom",
	},
	{
		content: (
			<div className="space-y-2">
				<h3 className="font-semibold text-base">Recent Files</h3>
				<p>Access your most recently modified documents and references here.</p>
			</div>
		),
		selectorId: TOUR_STEP_IDS.RECENT_FILES,
		position: "top",
	},
	{
		content: (
			<div className="space-y-2">
				<h3 className="font-semibold text-base">Status Bar</h3>
				<p>View statistics about your workspace and account information.</p>
			</div>
		),
		selectorId: TOUR_STEP_IDS.STATUS_BAR,
		position: "top",
	},
	{
		content: (
			<div className="space-y-2">
				<h3 className="font-semibold text-base">Toggle Sidebar</h3>
				<p>
					Expand or collapse the sidebar to create more space for your content.
				</p>
			</div>
		),
		selectorId: TOUR_STEP_IDS.SIDEBAR_TOGGLE,
		position: "right",
	},
	{
		content: (
			<div className="space-y-2">
				<h3 className="font-semibold text-base">Command Menu</h3>
				<p>Use the command menu to quickly navigate and find functionality.</p>
			</div>
		),
		selectorId: TOUR_STEP_IDS.COMMAND_MENU,
		position: "right",
	},
	{
		content: (
			<div className="space-y-2">
				<h3 className="font-semibold text-base">Document Management</h3>
				<p>Access all your documents here. Click to open a document.</p>
			</div>
		),
		selectorId: TOUR_STEP_IDS.MY_DOCUMENTS,
		position: "right",
	},
	{
		content: (
			<div className="space-y-2">
				<h3 className="font-semibold text-base">Integrations</h3>
				<p>
					Connect with other tools and services to add more context to your AI
					assistant.
				</p>
			</div>
		),
		selectorId: TOUR_STEP_IDS.INTEGRATIONS,
		position: "right",
	},
];

export function HomeTour() {
	const { setSteps, isTourCompleted } = useTour();
	const [openTour, setOpenTour] = useState(false);
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// Get navigation source if available
	const from = searchParams.get("from");
	const isNavigated = !!from;

	useEffect(() => {
		// Set tour steps
		setSteps(HOME_TOUR_STEPS);

		// Check localStorage first
		let isCompleted = false;
		try {
			const completedStatus = localStorage.getItem("tour-completed-home");
			isCompleted = completedStatus === "true";
		} catch (error) {
			console.error("Error reading from localStorage:", error);
		}

		// Only show tour if not completed and either:
		// 1. We're navigating from another page (isNavigated is true)
		// 2. This is a direct load/refresh (no from parameter)
		if (!isCompleted && !isTourCompleted) {
			// Show tour dialog after a short delay
			const timer = setTimeout(() => {
				setOpenTour(true);
			}, 1000);

			return () => clearTimeout(timer);
		}
	}, [setSteps, isTourCompleted]);

	return (
		<TourAlertDialog
			isOpen={openTour}
			setIsOpen={setOpenTour}
			title="Welcome to text0"
			description="Let's explore the home page together. This is your starting point for everything."
		/>
	);
}
