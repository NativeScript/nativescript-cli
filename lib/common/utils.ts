export class Utils implements IUtils {
	constructor(private $options: ICommonOptions,
		private $logger: ILogger) { }

	public getParsedTimeout(defaultTimeout: number): number {
		let timeout = defaultTimeout;
		if (this.$options.timeout) {
			const parsedValue = parseInt(this.$options.timeout);
			if (!isNaN(parsedValue) && parsedValue >= 0) {
				timeout = parsedValue;
			} else {
				this.$logger.warn("Specify timeout in a number of seconds to wait. Default value: " + timeout + " seconds will be used.");
			}
		}

		return timeout;
	}

	public getMilliSecondsTimeout(defaultTimeout: number): number {
		const timeout = this.getParsedTimeout(defaultTimeout);
		return timeout * 1000;
	}
}
$injector.register("utils", Utils);
