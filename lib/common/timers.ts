export class Timers implements ITimers {
	constructor(private $processService: IProcessService) {
	}

	public setInterval(callback: (...args: any[]) => void, ms: number, ...args: any[]): NodeJS.Timer {
		const timer = setInterval(callback, ms, args);
		this.$processService.attachToProcessExitSignals(this, () => clearInterval(timer));
		return timer;
	}
}

$injector.register("timers", Timers);
