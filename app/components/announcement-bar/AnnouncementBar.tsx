"use client";

import { Button } from "@/components/ui/button";
import { HIDE_ANNOUNCEMENT_BAR_COOKIE } from "@/lib/local-cookies";
import { setCookie } from "cookies-next";
import { XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

export function AnnouncementBar() {
	const [showAnnouncement, setShowAnnouncement] = useState(true);

	const handleDismiss = () => {
		setShowAnnouncement(false);
		setCookie(HIDE_ANNOUNCEMENT_BAR_COOKIE, "true", {
			path: "/",
			sameSite: "strict",
		});
	};

	return (
		<AnimatePresence>
			{showAnnouncement && (
				<motion.div
					exit={{ height: 0, translateY: -100 }}
					transition={{ type: "easeOut", duration: 0.25 }}
					className="flex h-10 items-center justify-center bg-muted px-4 text-foreground"
				>
					<div className="flex items-center gap-2 text-center text-xs sm:text-sm">
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
							className="!p-0 size-6 rounded-full border border-border text-xs opacity-60 transition-all hover:bg-primary/10 hover:opacity-100"
						>
							<XIcon className="size-2" />
						</Button>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
