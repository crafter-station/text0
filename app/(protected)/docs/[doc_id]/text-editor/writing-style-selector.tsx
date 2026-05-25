"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@/components/ui/select";
import { useWritingStyle } from "@/hooks/use-writing-style";
import { getWritingStyle, writingStyles } from "@/lib/writing-styles";
import {
	Briefcase,
	Feather,
	GraduationCap,
	Laugh,
	Lightbulb,
	type LucideIcon,
	Sparkles,
} from "lucide-react";

const STYLE_ICONS: Record<string, LucideIcon> = {
	sparkles: Sparkles,
	"graduation-cap": GraduationCap,
	briefcase: Briefcase,
	laugh: Laugh,
	feather: Feather,
	lightbulb: Lightbulb,
};

function StyleIcon({
	icon,
	className,
}: Readonly<{ icon: string; className?: string }>) {
	const Icon = STYLE_ICONS[icon] ?? Sparkles;
	return <Icon className={className} />;
}

export function WritingStyleSelector() {
	const [writingStyle, setWritingStyle] = useWritingStyle();
	const selectedStyle = getWritingStyle(writingStyle);

	return (
		<Select
			value={selectedStyle.id}
			onValueChange={(value: string) => setWritingStyle(value)}
			name="writing-style-selector"
		>
			<SelectTrigger
				className="h-8 w-full text-xs"
				aria-label="Select writing style"
			>
				<div className="flex items-center gap-2">
					<StyleIcon
						icon={selectedStyle.icon}
						className="size-4 text-primary"
					/>
					<span className="font-medium">{selectedStyle.name}</span>
				</div>
			</SelectTrigger>
			<SelectContent>
				{writingStyles.map((style) => (
					<SelectItem
						key={style.id}
						value={style.id}
						aria-label={`${style.name} - ${style.description}`}
					>
						<div className="flex items-center gap-2">
							<span aria-hidden={true}>
								<StyleIcon icon={style.icon} className="size-4" />
							</span>
							<div className="flex flex-col">
								<span className="font-medium">{style.name}</span>
								<span className="text-muted-foreground text-sm">
									{style.description}
								</span>
							</div>
						</div>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
