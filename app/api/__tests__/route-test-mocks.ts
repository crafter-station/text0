/**
 * Shared mock state and factories for /api/chat and /api/completion route tests.
 * Call recorders live here so mock.module factories and assertions share one source of truth.
 */

export type StubModel = {
	id: string;
	provider: string;
};

export type StreamTextCall = {
	model: StubModel;
	system?: string;
	messages?: unknown;
	prompt?: string;
	temperature?: number;
	maxTokens?: number;
};

export type VectorQueryResult = {
	score: number;
	data: string;
};

export type VectorQueryArgs = {
	data: string;
	topK: number;
	includeData: boolean;
	filter: string;
};

export const streamTextCalls: StreamTextCall[] = [];
export const vectorQueryCalls: VectorQueryArgs[] = [];

let vectorQueryImpl: (args: VectorQueryArgs) => Promise<VectorQueryResult[]> =
	async () => [];

let sessionImpl: () => Promise<{ userId: string }> = async () => ({
	userId: "test-user",
});

export function resetRouteMocks(): void {
	streamTextCalls.length = 0;
	vectorQueryCalls.length = 0;
	vectorQueryImpl = async () => [];
	sessionImpl = async () => ({ userId: "test-user" });
}

export function setVectorQueryImpl(
	impl: (args: VectorQueryArgs) => Promise<VectorQueryResult[]>,
): void {
	vectorQueryImpl = impl;
}

export function setSessionImpl(impl: () => Promise<{ userId: string }>): void {
	sessionImpl = impl;
}

export function stubModel(provider: string) {
	return (id: string): StubModel => ({ id, provider });
}

export function createStreamTextMock() {
	return (opts: StreamTextCall) => {
		streamTextCalls.push(opts);
		return {
			toDataStreamResponse: () => new Response("stream", { status: 200 }),
		};
	};
}

export function createAuthServerMock() {
	return {
		getSecureSession: () => sessionImpl(),
		getSecureUser: async () => ({
			id: "test-user",
			fullName: "Test User",
		}),
	};
}

export function createVectorMock() {
	return {
		vector: {
			query: async (args: VectorQueryArgs) => {
				vectorQueryCalls.push(args);
				return vectorQueryImpl(args);
			},
		},
	};
}

export function lastStreamModel(): StubModel | undefined {
	return streamTextCalls.at(-1)?.model;
}
