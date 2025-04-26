"use client";

import {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import { DialogContent } from "@/components/ui/dialog";
import { DiscordIcon } from "@/components/ui/icons/discord";
import { GithubIcon } from "@/components/ui/icons/github";
import { GmailIcon } from "@/components/ui/icons/gmail";
import { GoogleCalendarIcon } from "@/components/ui/icons/google-calendar";
import { GoogleDocsIcon } from "@/components/ui/icons/google-docs";
import { LinearIcon } from "@/components/ui/icons/linear";
import { MsTeamsIcon } from "@/components/ui/icons/ms-teams";
import { NotionIcon } from "@/components/ui/icons/notion";
import { SlackIcon } from "@/components/ui/icons/slack";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
	ArrowUp,
	FileText,
	LayoutGrid,
	Plus,
	Search,
	Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useState } from "react";

interface Document {
	id: string;
	name: string;
	content?: string;
	createdAt?: string;
}

interface CommandMenuProps {
	documents?: Document[];
	onCreateDocument?: () => void;
	variant?: "default" | "icon";
	className?: string;
}

export function CommandMenu({
	documents = [],
	onCreateDocument,
	variant = "default",
	className,
}: CommandMenuProps) {
	const [open, setOpen] = useState(false);
	const router = useRouter();

	React.useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((open) => !open);
			}
		};
		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	const integrations = [
		{ name: "GitHub", icon: GithubIcon, link: "/integrations/github" },
		{ name: "Notion", icon: NotionIcon, link: "/integrations/notion" },
		{ name: "Linear", icon: LinearIcon, link: "/integrations/linear" },
		{ name: "Discord", icon: DiscordIcon, link: "/integrations/discord" },
		{
			name: "Slack",
			icon: SlackIcon,
			link: "/integrations/slack",
			disabled: true,
			status: "Soon",
		},
		{
			name: "Gmail",
			icon: GmailIcon,
			link: "/integrations/gmail",
			disabled: true,
			status: "Soon",
		},
		{
			name: "Google Calendar",
			icon: GoogleCalendarIcon,
			link: "/integrations/google-calendar",
			disabled: true,
			status: "Soon",
		},
		{
			name: "Google Docs",
			icon: GoogleDocsIcon,
			link: "/integrations/google-docs",
			disabled: true,
			status: "Soon",
		},
		{
			name: "Microsoft Teams",
			icon: MsTeamsIcon,
			link: "/integrations/microsoft-teams",
			disabled: true,
			status: "Soon",
		},
	];

	return (
		<>
			<SidebarMenuButton
				variant="outline"
				tooltip="Search documents and navigation"
				size="default"
				onClick={() => setOpen(true)}
				className={cn(
					"!h-9 relative flex w-full items-center justify-between border border-border px-2 text-muted-foreground text-sm dark:bg-muted",
					className,
				)}
			>
				<span className="inline-flex w-full items-center justify-between group-data-[collapsible=icon]:justify-center">
					<span className="flex items-center gap-2">
						<Search className="h-4 w-4" />
						<span className="group-data-[collapsible=icon]:hidden">
							Search or press
						</span>
					</span>
					<kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium font-mono text-[10px] text-foreground group-data-[collapsible=icon]:hidden sm:flex">
						<span className="text-xs">⌘</span>K
					</kbd>
				</span>
			</SidebarMenuButton>

			<CommandDialog open={open} onOpenChange={setOpen}>
				<DialogContent
					className="!rounded-xl max-w-[640px] overflow-hidden border p-0 shadow-[0px_1px_1px_rgba(0,0,0,0.02),_0px_8px_16px_-4px_rgba(0,0,0,0.04),_0px_24px_32px_-8px_rgba(0,0,0,0.06)]"
					title="Command Menu"
				>
					<div className="relative flex flex-col overflow-hidden">
						<Command className="border-0">
							<CommandInput
								placeholder="What do you need?"
								className="h-12 border-0 text-lg placeholder:text-muted-foreground/50 focus:ring-0"
							/>

							<CommandList className="min-h-[400px] overflow-y-auto">
								<CommandEmpty className="py-6 text-center text-muted-foreground text-sm">
									No results found.
								</CommandEmpty>

								<CommandGroup
									heading="Documents"
									className="px-2 py-1.5 font-medium text-muted-foreground text-sm [&_[cmdk-group-heading]]:py-2.5 [&_[cmdk-group-heading]]:font-normal [&_[cmdk-group-heading]]:text-[13px] [&_[cmdk-group-heading]]:text-muted-foreground/70"
								>
									<CommandItem
										onSelect={() => {
											onCreateDocument?.();
											setOpen(false);
										}}
										className="flex cursor-pointer items-center gap-3 px-2 py-2.5 aria-selected:bg-accent aria-selected:text-accent-foreground"
									>
										<Plus className="h-4 w-4 text-muted-foreground/70" />
										<span className="font-medium">Create New Document</span>
										<div className="ml-auto flex items-center">
											<div className="flex items-center justify-center rounded border bg-background p-0.5 text-xs">
												<ArrowUp className="h-3 w-3" />
											</div>
											<div className="ml-1 flex items-center justify-center rounded border bg-background px-1.5 py-0.5 text-xs">
												N
											</div>
										</div>
									</CommandItem>

									{documents.map((doc) => (
										<CommandItem
											key={doc.id}
											onSelect={() => {
												router.push(`/docs/${doc.id}`);
												setOpen(false);
											}}
											className="flex cursor-pointer items-center gap-3 px-2 py-2.5 aria-selected:bg-accent aria-selected:text-accent-foreground"
										>
											<FileText className="h-4 w-4 text-muted-foreground/70" />
											<span className="font-medium">{doc.name}</span>
										</CommandItem>
									))}
								</CommandGroup>

								<CommandSeparator />

								<CommandGroup
									heading="Integrations"
									className="px-2 py-1.5 font-medium text-muted-foreground text-sm [&_[cmdk-group-heading]]:py-2.5 [&_[cmdk-group-heading]]:font-normal [&_[cmdk-group-heading]]:text-[13px] [&_[cmdk-group-heading]]:text-muted-foreground/70"
								>
									{integrations.map((integration) => (
										<CommandItem
											key={integration.name}
											onSelect={() => {
												if (!integration.disabled) {
													router.push(integration.link);
													setOpen(false);
												}
											}}
											disabled={integration.disabled}
											className="flex cursor-pointer items-center gap-3 px-2 py-2.5 aria-selected:bg-accent aria-selected:text-accent-foreground"
										>
											<integration.icon className="h-4 w-4 text-muted-foreground/70" />
											<span className="font-medium">{integration.name}</span>
											{integration.status && (
												<span className="ml-auto text-muted-foreground text-xs">
													{integration.status}
												</span>
											)}
										</CommandItem>
									))}
								</CommandGroup>

								<CommandSeparator />

								<CommandGroup
									heading="Navigation"
									className="px-2 py-1.5 font-medium text-muted-foreground text-sm [&_[cmdk-group-heading]]:py-2.5 [&_[cmdk-group-heading]]:font-normal [&_[cmdk-group-heading]]:text-[13px] [&_[cmdk-group-heading]]:text-muted-foreground/70"
								>
									<CommandItem
										onSelect={() => {
											router.push("/");
											setOpen(false);
										}}
										className="flex cursor-pointer items-center gap-3 px-2 py-2.5 aria-selected:bg-accent aria-selected:text-accent-foreground"
									>
										<LayoutGrid className="h-4 w-4 text-muted-foreground/70" />
										<span className="font-medium">Home</span>
										<div className="ml-auto flex items-center">
											<div className="flex items-center justify-center rounded border bg-background px-1.5 py-0.5 text-xs">
												H
											</div>
										</div>
									</CommandItem>
									<CommandItem
										onSelect={() => {
											router.push("/references");
											setOpen(false);
										}}
										className="flex cursor-pointer items-center gap-3 px-2 py-2.5 aria-selected:bg-accent aria-selected:text-accent-foreground"
									>
										<FileText className="h-4 w-4 text-muted-foreground/70" />
										<span className="font-medium">Memories</span>
										<div className="ml-auto flex items-center">
											<div className="flex items-center justify-center rounded border bg-background px-1.5 py-0.5 text-xs">
												R
											</div>
										</div>
									</CommandItem>
									<CommandItem
										onSelect={() => {
											router.push("/integrations");
											setOpen(false);
										}}
										className="flex cursor-pointer items-center gap-3 px-2 py-2.5 aria-selected:bg-accent aria-selected:text-accent-foreground"
									>
										<Settings className="h-4 w-4 text-muted-foreground/70" />
										<span className="font-medium">All Integrations</span>
										<div className="ml-auto flex items-center">
											<div className="flex items-center justify-center rounded border bg-background px-1.5 py-0.5 text-xs">
												I
											</div>
										</div>
									</CommandItem>
								</CommandGroup>
							</CommandList>
						</Command>
					</div>
				</DialogContent>
			</CommandDialog>
		</>
	);
}
