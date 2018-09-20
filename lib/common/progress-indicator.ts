import { isInteractive } from './helpers';

export class ProgressIndicator implements IProgressIndicator {
	constructor(private $logger: ILogger) { }

	public async showProgressIndicator<T>(promise: Promise<T>, timeout: number, options?: { surpressTrailingNewLine?: boolean }): Promise<T> {
		const surpressTrailingNewLine = options && options.surpressTrailingNewLine;

		let isFulfilled = false;

		const tempPromise = new Promise<T>((resolve, reject) => {
			promise
				.then(res => {
					isFulfilled = true;
					resolve(res);
				})
				.catch(err => {
					isFulfilled = true;
					reject(err);
				});
		});

		if (!isInteractive()) {
			while (!isFulfilled) {
				await this.$logger.printMsgWithTimeout(".", timeout);
			}
		}

		if (!surpressTrailingNewLine) {
			this.$logger.out();
		}

		return tempPromise;
	}
}
$injector.register("progressIndicator", ProgressIndicator);
