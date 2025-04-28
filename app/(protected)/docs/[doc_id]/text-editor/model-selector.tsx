"use client";

import { AnthropicLogo } from "@/components/ui/anthropic-logo";
import { GoogleLogo } from "@/components/ui/google-logo";
import { LlamaLogo } from "@/components/ui/llama-logo";
import { OpenAILogo } from "@/components/ui/openai-logo";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@/components/ui/select";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { XAILogo } from "@/components/ui/xai-logo";
import { useModel } from "@/hooks/use-model";
import { models } from "@/lib/models";

function ModelLogo({ model }: Readonly<{ model: (typeof models)[0] }>) {
	const logoProps = { className: "size-4" };

	switch (model.component) {
		case "anthropic":
			return <AnthropicLogo {...logoProps} />;
		case "google":
			return <GoogleLogo {...logoProps} />;
		case "openai":
			return <OpenAILogo {...logoProps} />;
		case "xai":
			return <XAILogo {...logoProps} />;
		case "llama":
			return <LlamaLogo {...logoProps} />;
		default:
			return null;
	}
}

export function ModelSelector() {
	const [model, setModel] = useModel();
	const selectedModel = models.find((m) => m.id === model);

	return (
		<div className="group-data-[collapsible=icon]:w-auto [&_[data-slot=select-trigger]>svg]:group-data-[collapsible=icon]:hidden">
			<Tooltip>
				<TooltipTrigger asChild>
					<Select
						value={model}
						onValueChange={(value: string) => setModel(value)}
						name="model-selector"
					>
						<SelectTrigger
							withoutIcon
							className="!w-8 !h-8 flex items-center justify-center p-0"
							aria-label="Select AI model"
						>
							{selectedModel && <ModelLogo model={selectedModel} />}
						</SelectTrigger>
						<SelectContent>
							{models.map((model) => (
								<SelectItem
									key={model.id}
									value={model.id}
									aria-label={`${model.name} - ${model.description}`}
								>
									<div className="flex items-center gap-2">
										<span aria-hidden={true}>
											<ModelLogo model={model} />
										</span>
										<div className="flex flex-col">
											<span className="font-medium">{model.name}</span>
											<span className="text-muted-foreground text-sm">
												{model.description}
											</span>
										</div>
									</div>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</TooltipTrigger>
				<TooltipContent
					side="left"
					className="hidden group-data-[collapsible=icon]:block"
				>
					<div className="flex flex-col gap-1">
						<span className="font-medium">{selectedModel?.name}</span>
						<span className="text-accent text-xs">
							{selectedModel?.description}
						</span>
					</div>
				</TooltipContent>
			</Tooltip>
		</div>
	);
}
