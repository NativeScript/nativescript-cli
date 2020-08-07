export class Queue<T> implements IQueue<T> {
	private promiseResolve: (value?: void | PromiseLike<void>) => void;

	public constructor(private items?: T[]) {
		this.items = this.items === undefined ? [] : this.items;
	}

	public enqueue(item: T): void {
		this.items.unshift(item);

		if (this.promiseResolve) {
			this.promiseResolve();
		}
	}

	public async dequeue(): Promise<T> {
		if (!this.items.length) {
			const promise = new Promise<void>((resolve, reject) => {
				this.promiseResolve = resolve;
			});

			await promise;

			this.promiseResolve = null;
		}

		return this.items.pop();
	}
}
