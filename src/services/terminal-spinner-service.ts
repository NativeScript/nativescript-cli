import * as ora from 'ora';

export class TerminalSpinnerService implements ITerminalSpinnerService {
	public createSpinner(spinnerOptions: ITerminalSpinnerOptions = {}): ITerminalSpinner {
		spinnerOptions.stream = spinnerOptions.stream || process.stdout;
		return new (ora as any)(spinnerOptions);
	}

	public async execute<T>(spinnerOptions: ITerminalSpinnerOptions, action: () => Promise<T>): Promise<T> {
		const spinner = this.createSpinner(spinnerOptions);

		spinner.start();

		let result: T = null;
		try {
			result = await action();
		} catch (err) {
			spinner.fail();
			return null;
		}

		spinner.succeed();

		return result;
	}
}
$injector.register('terminalSpinnerService', TerminalSpinnerService);
