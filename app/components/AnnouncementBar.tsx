"use client";

import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import { useState } from "react";

export function AnnouncementBar() {
	const [showAnnouncement, setShowAnnouncement] = useState(true);

	if (!showAnnouncement) return null;

	return (
		<div className="absolute top-0 z-50 flex w-full items-center justify-center bg-muted px-4 py-2 text-foreground">
			<div className="flex items-center gap-2 text-center text-sm">
				<a
					href="https://youtu.be/KDRwgbwq0_c?t=1143"
					target="_blank"
					rel="noopener noreferrer"
				>
					🏆 We won the first global ▲ Next.js Hackathon!
				</a>
				<div className="-translate-y-1">.</div>
				<a
					href="https://github.com/crafter-station/text0"
					target="_blank"
					rel="noopener noreferrer"
				>
					Star the repo ⭐
				</a>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					onClick={() => setShowAnnouncement(false)}
					className="!p-0 size-6 rounded-full border border-border text-xs opacity-60 transition-all hover:bg-primary/10 hover:opacity-100"
				>
					<XIcon className="size-2" />
				</Button>
			</div>
		</div>
	);
}
