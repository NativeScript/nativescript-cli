export class ProcessService implements IProcessService {
	private static PROCESS_EXIT_SIGNALS = ["exit", "SIGINT", "SIGTERM"];
	private _listeners: IListener[];

	public get listenersCount(): number {
		return this._listeners.length;
	}

	constructor() {
		this._listeners = [];
	}

	public attachToProcessExitSignals(context: any, callback: () => void): void {
		const callbackToString = callback.toString();

		if (this._listeners.length === 0) {
			_.each(ProcessService.PROCESS_EXIT_SIGNALS, (signal: string) => {
				process.on(signal, () => this.executeAllCallbacks.apply(this));
			});
		}

		if (!_.some(this._listeners, (listener: IListener) => context === listener.context && callbackToString === listener.callback.toString())) {
			this._listeners.push({ context, callback });
		}
	}

	private executeAllCallbacks(): void {
		_.each(this._listeners, (listener: IListener) => {
			try {
				listener.callback.apply(listener.context);
			} catch (err) {
				// ignore the error and let other handlers to be called.
			}
		});
	}
}

interface IListener {
	context: any;
	callback: () => void;
}

$injector.register("processService", ProcessService);
