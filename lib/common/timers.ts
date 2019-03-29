export class Timers implements ITimers {
	private pendingIntervalIds: NodeJS.Timer[] = [];

	constructor(private $processService: IProcessService) {
		this.$processService.attachToProcessExitSignals(this, () => {
			_.each(this.pendingIntervalIds, clearInterval);
		});
	}

	public setInterval(callback: (...args: any[]) => void, ms: number, ...args: any[]): NodeJS.Timer {
		const timer = setInterval(callback, ms, args);

		this.pendingIntervalIds.push(timer);

		return timer;
	}

	public clearInterval(intervalId: NodeJS.Timer): void {
		clearInterval(intervalId);

		_.remove(this.pendingIntervalIds, id => id === intervalId);
	}
}

$injector.register("timers", Timers);
