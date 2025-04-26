"use client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useTheme } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useEffect, useState } from "react";

export const Providers = ({ children }: { children: React.ReactNode }) => {
	const queryClient = new QueryClient();
	const { resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	return (
		<NuqsAdapter>
			<ClerkProvider
				appearance={{
					elements: {
						headerTitle: "!text-foreground !text-lg",
						formButtonPrimary:
							"!bg-primary !border-border !text-primary-foreground hover:!bg-primary/90",
						card: "!bg-card !text-card-foreground !shadow-sm",
						footer: "!hidden",
						socialButtonsBlockButton:
							"!bg-muted !border !border-foreground/10 !text-muted-foreground hover:!bg-foreground/10",
						socialButtonsIconButton:
							"!border !border-input !bg-background hover:!bg-accent hover:!text-accent-foreground",
						formButtonReset: "!text-muted-foreground hover:!text-foreground",
						formFieldInput:
							"!text-foreground !border !border-input !bg-muted focus-visible:!bg-background !placeholder-muted-foreground focus-visible:!ring-offset-0 focus-visible:!ring-0 focus-visible:!ring-transparent",
						formFieldLabel: "!text-foreground !text-sm",
						formFieldAction: "!text-muted-foreground !text-sm",
						dividerText: "!text-muted-foreground !text-sm",
						dividerLine: "!bg-border",
						socialButtonsBlockButtonText: "!text-muted-foreground",
						userPreviewMainIdentifier: "!text-foreground !font-medium",
						userPreviewSecondaryIdentifier: "!text-muted-foreground !text-sm",
						socialButtonsProviderIcon__github: "dark:invert",
						rootBox: "!w-full",
						userButtonAvatarBox: "h-5 w-5",
						userButtonAvatarImage: "h-5 w-5",
						userButtonTrigger:
							"!h-10 !p-0 !w-full flex !justify-start !bg-muted !border !border-input hover:!bg-sidebar-accent  group-data-[collapsible=icon]:hover:!bg-transparent !px-2 group-data-[collapsible=icon]:!px-0 group-data-[collapsible=icon]:!bg-transparent group-data-[collapsible=icon]:!border-none transition-colors",

						userButtonBox:
							"!text-foreground !flex-row-reverse !gap-2 items-center",
						userButtonOuterIdentifier:
							"text-sm font-medium truncate group-data-[collapsible=icon]:!hidden",
						userButtonPopoverMain: "!bg-card !text-card-foreground",
						userButtonPopoverCard: "!bg-card !text-card-foreground",
						userButtonPopoverFooter: "!hidden",
						userButtonPopoverActionButton:
							"!bg-muted border-t !border-input !text-muted-foreground hover:!bg-foreground/10",
						userButtonPopoverActions: "!border-t !border-input",
					},
				}}
			>
				<QueryClientProvider client={queryClient}>
					<ThemeProvider
						attribute="class"
						disableTransitionOnChange
						defaultTheme="system"
					>
						<TooltipProvider delayDuration={0}>{children}</TooltipProvider>
					</ThemeProvider>
				</QueryClientProvider>
			</ClerkProvider>
		</NuqsAdapter>
	);
};
