"use client";

import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { setCookie } from "cookies-next";
import { HIDE_ANNOUNCEMENT_BAR_COOKIE } from "@/lib/local-cookies";

export function AnnouncementBar() {
	const [showAnnouncement, setShowAnnouncement] = useState(true);
	
	const handleDismiss = () => {
		setShowAnnouncement(false);
		setCookie(HIDE_ANNOUNCEMENT_BAR_COOKIE, "true", { 
			path: "/",
			sameSite: "strict"
		});
	};
	
	return (
		<AnimatePresence>
			{showAnnouncement && (
				<motion.div
					exit={{ height: 0, translateY: -100 }}
					transition={{ type: "easeOut", duration: 0.25 }}
					className="bg-muted text-foreground px-4 h-10 flex items-center justify-center"
			>
				<div className="flex text-center items-center gap-2 text-sm">
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
						onClick={handleDismiss}
						className="size-6 border border-border transition-all rounded-full !p-0 hover:bg-primary/10 text-xs opacity-60 hover:opacity-100"
					>
						<XIcon className="size-2" />
					</Button>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
