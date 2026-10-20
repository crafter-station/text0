import { afterAll, expect, mock, test } from "bun:test";

let storedModel = null;
let queryModel = null;
const originalWindow = globalThis.window;
const originalStorage = globalThis.localStorage;
globalThis.window = {};
globalThis.localStorage = {
	getItem: () => storedModel,
	setItem: (_key, value) => {
		storedModel = value;
	},
};
mock.module("nuqs", () => ({
	useQueryState: (_key, { defaultValue }) => [
		queryModel ?? defaultValue,
		() => {},
	],
}));
const react = await import("react");
mock.module("react", () => ({ ...react, useEffect: (effect) => effect() }));
afterAll(() => {
	globalThis.window = originalWindow;
	globalThis.localStorage = originalStorage;
});
const { useModel } = await import("./use-model");

for (const savedModel of [
	"MiniMax-M3.1-Flash",
	"MiniMax-M3",
	"MiniMax-M2.7",
	"MiniMax-custom-saved-model",
]) {
	test(`restores the saved ${savedModel} without resetting it`, () => {
		queryModel = null;
		storedModel = savedModel;
		expect(useModel()[0]).toBe(savedModel);
		expect(storedModel).toBe(savedModel);
	});
	test(`persists the explicit ${savedModel} query selection`, () => {
		storedModel = null;
		queryModel = savedModel;
		expect(useModel()[0]).toBe(savedModel);
		expect(storedModel).toBe(savedModel);
	});
}

test("retains the application default when no model is saved", () => {
	queryModel = null;
	storedModel = null;
	expect(useModel()[0]).toBe("gpt-4o-mini");
});
