import { models } from "@/lib/models";
import { useQueryState } from "nuqs";
import { useEffect } from "react";

const STORAGE_KEY = "selected-model";
const DEFAULT_MODEL = "gpt-4o-mini";

function isSupportedModel(model: string) {
	// Keep explicit MiniMax IDs usable even when they leave the ordinary picker.
	return (
		models.some((entry) => entry.id === model) || model.startsWith("MiniMax-")
	);
}

function safeGetItem(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch (error) {
		console.error("Failed to read from localStorage", error);
		return null;
	}
}

function safeSetItem(key: string, value: string) {
	try {
		localStorage.setItem(key, value);
	} catch (error) {
		console.error("Failed to write to localStorage", error);
	}
}

function getInitialModel() {
	if (typeof window !== "undefined") {
		const storedModel = safeGetItem(STORAGE_KEY);
		if (storedModel && isSupportedModel(storedModel)) {
			return storedModel;
		}
	}
	return DEFAULT_MODEL;
}

export function useModel() {
	const [model, setModel] = useQueryState("model", {
		defaultValue: getInitialModel(),
	});

	useEffect(() => {
		if (model && isSupportedModel(model)) {
			safeSetItem(STORAGE_KEY, model);
		}
	}, [model]);

	return [model, setModel] as const;
}
