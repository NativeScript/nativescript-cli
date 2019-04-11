// TODO: Delete this service, it does not bring any value
export class Timers implements ITimers {
	public setInterval(callback: (...args: any[]) => void, ms: number, ...args: any[]): NodeJS.Timer {
		const timer = setInterval(callback, ms, args);

		return timer;
	}

	public clearInterval(intervalId: NodeJS.Timer): void {
		clearInterval(intervalId);
	}
}

$injector.register("timers", Timers);
