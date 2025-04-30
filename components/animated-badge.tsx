"use client";

import { CrafterIcon } from "@/components/ui/icons/crafter";
import { VercelIcon } from "@/components/ui/icons/vercel";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

export function AnimatedBadge() {
	const [isVercel, setIsVercel] = useState(true);

	useEffect(() => {
		const interval = setInterval(() => {
			setIsVercel((prev) => !prev);
		}, 2000); // Switch every 2 seconds

		return () => clearInterval(interval);
	}, []);

	return (
		<div className="mb-8 flex justify-center items-center gap-2 rounded-full border border-border/50 bg-background/50 px-3 py-1.5 backdrop-blur-sm w-[24ch]">
			<AnimatePresence mode="wait">
				<motion.div
					key={isVercel ? "vercel" : "crafter"}
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -10 }}
					transition={{ duration: 0.3 }}
					className="flex justify-center items-center gap-2"
				>
					{isVercel ? (
						<VercelIcon size={16} className="text-foreground" />
					) : (
						<CrafterIcon size={16} className="text-foreground" />
					)}
					<span className="text-muted-foreground text-sm text-center">
						{isVercel
							? "Built for Vercel Hackathon"
							: "Built by Crafter Station"}
					</span>
				</motion.div>
			</AnimatePresence>
		</div>
	);
}
