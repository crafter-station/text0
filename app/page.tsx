import { AnimatedBadge } from "@/components/animated-badge";
import { AnimatedPrompt } from "@/components/animated-prompt";
import { T0Keycap } from "@/components/t0-keycap";
import { TextScramble } from "@/components/text-scramble";
import { DiscordIcon } from "@/components/ui/icons/discord";
import { GithubIcon } from "@/components/ui/icons/github";
import { XIcon } from "@/components/ui/icons/x-icon";
import Image from "next/image";
import { AnnouncementBarWrapper } from "./components/announcement-bar/AnnouncementBarWrapper";

export default async function LandingPage() {
	return (
		<div className="relative flex h-screen flex-col overflow-hidden bg-background text-foreground">
			<div className="absolute top-0 right-0 left-0 z-50">
				<AnnouncementBarWrapper />
			</div>
			{/* Background Image */}
			<Image
				src="/bghero.webp"
				alt="Light ray background"
				width={2048}
				height={2048}
				className="-top-20 pointer-events-none absolute right-0 left-0 z-0 mx-auto hidden h-full w-full select-none md:block"
				priority
			/>

			{/* Main Content */}
			<main className="relative z-10 flex h-full flex-1 items-center justify-center overflow-auto">
				<div className="container mx-auto my-auto flex h-full max-w-2xl flex-col items-center justify-center">
					{/* Hackathon Badge */}
					<AnimatedBadge />

					{/* App Title */}
					<div className="mb-8 flex items-center justify-center gap-4 px-4 text-center">
						<div className="flex flex-col gap-1">
							<TextScramble
								as="h1"
								className="font-semibold text-4xl lowercase tracking-tight"
								characterSet={[
									"0",
									"1",
									"2",
									"3",
									"4",
									"5",
									"6",
									"7",
									"8",
									"9",
								]}
								animateOnHover={false}
							>
								text0
							</TextScramble>
							<p className="font-mono text-base text-muted-foreground uppercase">
								Your AI-native personal text editor
							</p>
						</div>
					</div>

					{/* Press T to Start Prompt */}
					<AnimatedPrompt />

					{/* Keyboard */}
					<div className="size-40">
						<T0Keycap />
					</div>
				</div>
			</main>

			{/* Status Bar */}
			<footer className="relative z-10 border-border/40 border-t bg-background/80 backdrop-blur-sm">
				<div className="container mx-auto flex h-8 max-w-2xl items-center justify-between px-4">
					<div className="flex items-center gap-4 text-muted-foreground text-xs">
						<a
							href="https://github.com/crafter-station/text0"
							target="_blank"
							rel="noopener noreferrer"
							className="hover:text-foreground"
						>
							<GithubIcon className="h-3.5 w-3.5" />
						</a>
						<a
							href="https://twitter.com/raillyhugo"
							target="_blank"
							rel="noopener noreferrer"
							className="hover:text-foreground"
						>
							<XIcon className="h-3.5 w-3.5" />
						</a>
						<div className="animate-pulse rounded-full bg-[#5865F2] p-1">
							<a
								href="https://discord.gg/7MfrzBAX"
								target="_blank"
								rel="noopener noreferrer"
								className="hover:text-foreground"
							>
								<DiscordIcon fill="var(--muted)" className="h-3.5 w-3.5" />
							</a>
						</div>
					</div>
					<div className="text-muted-foreground text-xs">
						Built by{" "}
						<a
							href="https://github.com/Railly"
							target="_blank"
							rel="noopener noreferrer"
							className="hover:text-foreground"
						>
							Railly
						</a>{" "}
						&{" "}
						<a
							href="https://cueva.io"
							target="_blank"
							rel="noopener noreferrer"
							className="hover:text-foreground"
						>
							Anthony
						</a>
					</div>
				</div>
			</footer>
		</div>
	);
}
