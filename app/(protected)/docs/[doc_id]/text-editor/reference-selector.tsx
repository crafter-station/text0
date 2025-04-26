"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useReferenceProcessing } from "@/hooks/use-reference-processing";
import { useReferences } from "@/hooks/use-references";
import { useSelectedReferences } from "@/hooks/use-selected-references";
import type { Reference } from "@/lib/redis";
import { AlertCircle, CheckCircle, ExternalLink, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function ReferenceSelector() {
	const { doc_id } = useParams();
	const { data: references, isLoading, refetch } = useReferences();
	const { processingStatus } = useReferenceProcessing(references);
	const { isReferenceSelected, toggleReference } = useSelectedReferences(
		doc_id as string,
	);
	const [recentlyAdded, setRecentlyAdded] = useState<string[]>([]);

	// Monitor localStorage for changes in references (when a new reference is added)
	useEffect(() => {
		const checkForNewReferences = () => {
			refetch();
		};

		// Set up event listener for storage events
		window.addEventListener("storage", checkForNewReferences);

		// Also check periodically
		const interval = setInterval(checkForNewReferences, 30000);

		return () => {
			window.removeEventListener("storage", checkForNewReferences);
			clearInterval(interval);
		};
	}, [refetch]);

	// Watch for changes in references to identify newly added ones
	useEffect(() => {
		if (!references || !Array.isArray(references)) return;

		// Compare references with the previously rendered list
		const newReferences = references
			.filter((ref) => {
				// Consider a reference new if it was added in the last 5 seconds
				const uploadTime = ref.uploadedAt
					? new Date(ref.uploadedAt).getTime()
					: 0;
				const now = Date.now();
				return now - uploadTime < 5000;
			})
			.map((ref) => ref.id);

		// If we found new references
		if (newReferences.length > 0) {
			setRecentlyAdded((prev) => [...prev, ...newReferences]);

			// Show a toast notification
			if (newReferences.length === 1) {
				const newRef = references.find((ref) => ref.id === newReferences[0]);
				toast.success(
					`Added reference: ${newRef?.name || newRef?.filename || "Document"}`,
				);
			} else {
				toast.success(`Added ${newReferences.length} new references`);
			}

			// Clear the "recently added" highlight after 5 seconds
			setTimeout(() => {
				setRecentlyAdded((prev) =>
					prev.filter((id) => !newReferences.includes(id)),
				);
			}, 5000);
		}
	}, [references]);

	if (isLoading) {
		return (
			<div className="h-[250px] space-y-1 p-1">
				<Skeleton className="h-8 w-full" />
				<Skeleton className="h-8 w-full" />
				<Skeleton className="h-8 w-full" />
			</div>
		);
	}

	return (
		<ScrollArea className="h-[250px] bg-background/50">
			<Table className="w-full table-fixed">
				<TableBody>
					{(references ?? []).map((reference: Reference) => {
						const processing = processingStatus[reference.id];
						const isProcessing = processing?.isProcessing;
						const progress = processing?.progress;
						const hasError = !!processing?.error;

						return (
							<TableRow
								key={reference.id}
								className={`group border-border/20 border-b transition-colors last:border-b-0 ${
									recentlyAdded.includes(reference.id)
										? "animate-pulse bg-primary/5"
										: "hover:bg-accent/30"
								}`}
							>
								<TableCell className="w-10 p-2 align-top">
									<Checkbox
										id={reference.id}
										checked={isReferenceSelected(reference.id)}
										onCheckedChange={() => toggleReference(reference.id)}
										disabled={isProcessing}
										className="mt-0.5 data-[state=checked]:bg-primary/90 data-[state=checked]:text-primary-foreground"
									/>
								</TableCell>
								<TableCell className="min-w-0 p-2">
									<div className="flex items-center">
										<label
											htmlFor={reference.id}
											className="line-clamp-2 flex-grow text-ellipsis text-balance break-words font-medium text-foreground/80 text-xs leading-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
										>
											{(reference.name ?? reference.filename ?? "").slice(
												0,
												60,
											)}
											{(reference.name ?? reference.filename ?? "").length > 60
												? "..."
												: ""}
										</label>
									</div>

									{/* Processing indicator */}
									{isProcessing && (
										<div className="mt-1">
											<div className="flex items-center text-muted-foreground text-xs">
												<Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
												<span className="font-medium text-[10px] uppercase tracking-wide opacity-80">
													{processing.status || "Processing..."}
												</span>
											</div>
											{typeof progress === "number" && (
												<Progress
													value={progress}
													className="mt-1.5 h-1"
													aria-label="Processing progress"
												/>
											)}
										</div>
									)}

									{/* Error indicator */}
									{hasError && (
										<div className="mt-1 flex items-center text-destructive text-xs">
											<AlertCircle className="mr-1.5 h-3 w-3" />
											<span className="font-medium text-[10px]">
												{processing.error}
											</span>
										</div>
									)}

									{/* Completed indicator */}
									{!isProcessing && !hasError && processing && (
										<div className="mt-1 flex items-center text-primary text-xs">
											<CheckCircle className="mr-1.5 h-3 w-3" />
											<span className="font-medium text-[10px] uppercase tracking-wide">
												Processing complete
											</span>
										</div>
									)}
								</TableCell>
								<TableCell className="w-10 p-2 align-middle">
									<Button
										variant="ghost"
										size="icon"
										className="size-5 flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
										asChild
										aria-label={`Open ${
											reference.name ?? reference.filename
										} in new tab`}
									>
										<a
											href={reference.url}
											target="_blank"
											rel="noopener noreferrer"
											aria-label={`Open ${
												reference.name ?? reference.filename
											} in new tab`}
										>
											<ExternalLink className="!size-3.5" />
										</a>
									</Button>
								</TableCell>
								{recentlyAdded.includes(reference.id) && (
									<TableCell className="w-12 p-2 align-middle">
										<span className="flex items-center font-semibold text-[10px] text-primary uppercase tracking-wider">
											new
										</span>
									</TableCell>
								)}
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
			{(references || [])?.length === 0 && (
				<div className="flex h-full flex-col items-center justify-center px-4 py-8">
					<p className="mb-1 text-center text-muted-foreground text-xs">
						No references available
					</p>
					<p className="text-center text-[10px] text-muted-foreground/70">
						Add references to enhance AI responses
					</p>
				</div>
			)}
		</ScrollArea>
	);
}
