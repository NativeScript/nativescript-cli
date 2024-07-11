import { IOptions } from "../declarations";
import { IUtils } from "./declarations";
import { injector } from "./yok";

export class Utils implements IUtils {
	constructor(private $options: IOptions, private $logger: ILogger) {}

	public getParsedTimeout(defaultTimeout: number): number {
		let timeout = defaultTimeout;
		if (this.$options.timeout) {
			const parsedValue = parseInt(this.$options.timeout);
			if (!isNaN(parsedValue) && parsedValue >= 0) {
				timeout = parsedValue;
			} else {
				this.$logger.warn(
					"Specify timeout in a number of seconds to wait. Default value: " +
						timeout +
						" seconds will be used."
				);
			}
		}

		return timeout;
	}

	public getMilliSecondsTimeout(defaultTimeout: number): number {
		const timeout = this.getParsedTimeout(defaultTimeout);
		return timeout * 1000;
	}
}

export function capitalizeFirstLetter(value: string) {
	if (!value) {
		return "";
	}
	return value.charAt(0).toUpperCase() + value.slice(1);
}

injector.register("utils", Utils);
