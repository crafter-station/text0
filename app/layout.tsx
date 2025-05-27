import "./globals.css";
import { TourProvider } from "@/components/tour";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PleaseStarUsOnGitHub } from "./components/PleaseStarUsOnGitHub";
import { Providers } from "./providers";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Text0 – The AI-Native Personal Text Editor",
	description:
		"Text0 is your personal thinking partner. It completes your thoughts, remembers your context, and adapts the interface as you write. Built for developers, powered by AI, and integrated with your tools. This isn't just a text editor — it's your second brain.",
	keywords: [
		"Text0",
		"AI text editor",
		"Generative UI",
		"Second brain",
		"Memory-aware writing",
		"GPT-4o text editor",
		"AI-native interface",
		"Personal AI workspace",
		"Developer tools",
		"Obsidian alternative",
		"Next.js text editor",
		"Context-aware autocomplete",
		"Adaptive UI",
		"Railly Hugo",
		"Anthony Cueva",
	],
	applicationName: "Text0",
	authors: [
		{
			name: "Railly Hugo",
			url: "https://railly.dev",
		},
		{
			name: "Anthony Cueva",
			url: "https://cueva.io",
		},
	],
	creator: "Railly Hugo",
	publisher: "Crafter Station",
	metadataBase: new URL("https://text0.dev"),
	openGraph: {
		type: "website",
		title: "Text0 – The AI-Native Personal Text Editor",
		description:
			"A text editor that listens, completes, remembers. AI-native, voice-aware, memory-driven — built to match your flow.",
		url: "https://text0.dev",
		images: [
			{
				url: "https://text0.dev/og.png",
				width: 1200,
				height: 630,
				alt: "Text0 – Built by Railly Hugo and Anthony Cueva",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Text0 – The AI-Native Text Editor That Thinks With You",
		description:
			"More than autocomplete. Text0 remembers your context, adapts the interface, and integrates your tools into your flow. Write with AI that feels personal.",
		creator: "@raillyhugo, @cuevaio",
		images: ["https://text0.dev/og.png"],
	},
	themeColor: "#000000",
	icons: {
		icon: "/icon.svg",
		apple: "/apple-touch-icon.png",
	},
	category: "technology",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
			>
				<PleaseStarUsOnGitHub />
					<Providers>
						<TourProvider>{children}</TourProvider>
						<Toaster />
					</Providers>
				<Analytics />
			</body>
		</html>
	);
}
