"use client";

import type { Reference } from "@/lib/redis";
import { useRealtimeRunsWithTag } from "@/lib/trigger-hooks";
import { useEffect, useState } from "react";

interface ProcessingStatus {
	[referenceId: string]: {
		isProcessing: boolean;
		progress?: number;
		status?: string;
		error?: string;
	};
}

export function useReferenceProcessing(references?: Reference[]) {
	const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>(
		{},
	);

	// Create an array of reference IDs to monitor
	const referenceIds = references?.map((ref) => ref.id) || [];

	// For each reference, create a tag to monitor
	const tags = referenceIds.map((id) => `reference:${id}`);

	// Use the useRealtimeRunsWithTag hook to listen for processing status updates
	const { runs, error } = useRealtimeRunsWithTag(tags.join(","));

	// Update processing status whenever runs change
	useEffect(() => {
		if (!runs || !Array.isArray(runs)) return;

		const newProcessingStatus: ProcessingStatus = {};

		for (const run of runs) {
			// Extract the reference ID from the tag
			const refTag = run.tags?.find((tagValue: string) =>
				tagValue.startsWith("reference:"),
			);
			if (!refTag) continue;

			const refId = refTag.replace("reference:", "");

			// Calculate progress if available in metadata
			let progress: number | undefined;
			let statusMessage: string | undefined;

			if (run.metadata) {
				if (typeof run.metadata.progress === "number") {
					progress = run.metadata.progress;
				}
				if (typeof run.metadata.status === "string") {
					statusMessage = run.metadata.status;
				}
			}

			newProcessingStatus[refId] = {
				isProcessing:
					run.status === "RUNNING" ||
					run.status === "PENDING" ||
					run.status === "QUEUED",
				progress,
				status: statusMessage || run.status,
				error: run.status === "FAILED" ? run.error?.message : undefined,
			};
		}

		setProcessingStatus(newProcessingStatus);
	}, [runs]);

	return {
		processingStatus,
		isLoading: !runs && !error,
		error,
	};
}
