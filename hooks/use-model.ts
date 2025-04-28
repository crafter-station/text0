import { models } from "@/lib/models";
import { useQueryState } from "nuqs";
import { useEffect } from "react";

const STORAGE_KEY = "selected-model";
const DEFAULT_MODEL = "gpt-4o-mini";

const VALID_MODELS = models.map((model) => model.id);

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
		if (storedModel && VALID_MODELS.includes(storedModel)) {
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
		if (model && VALID_MODELS.includes(model)) {
			safeSetItem(STORAGE_KEY, model);
		}
	}, [model]);

	return [model, setModel] as const;
}
