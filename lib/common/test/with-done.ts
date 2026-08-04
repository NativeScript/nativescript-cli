export type DoneCallback = (err?: any) => void;

/**
 * Adapts a callback-style test to the promise form the runner expects. Useful
 * for tests driven by an event emitter, where the assertion happens inside a
 * listener rather than in the test body.
 */
export function withDone(
	body: (done: DoneCallback) => void,
): () => Promise<void> {
	return () =>
		new Promise<void>((resolve, reject) => {
			body((err?: any) => (err ? reject(err) : resolve()));
		});
}
