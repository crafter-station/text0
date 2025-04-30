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
					{/* YouTube Video Link */}
					<div className="relative mb-6">
						<div
							className="absolute inset-[-8px] animate-[pulse_3s_ease-in-out_infinite] rounded-full bg-red-500/30 blur-lg"
							style={{ transform: "scale(1.2)" }}
						/>
						<a
							href="https://www.youtube.com/live/KDRwgbwq0_c?si=mta-laiUpDWDF188&t=1142"
							target="_blank"
							rel="noopener noreferrer"
							className="relative block transition-transform hover:scale-105"
							aria-label="Watch us win at Cursor Hackathon"
						>
							<svg
								aria-label="YouTube"
								role="img"
								className="h-8 w-8"
								fill="#FF0000"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
							</svg>
						</a>
					</div>

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
