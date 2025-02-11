import ora from "ora";
import { injector } from "../common/yok";
import {
	ITerminalSpinner,
	ITerminalSpinnerOptions,
	ITerminalSpinnerService
} from "../definitions/terminal-spinner-service";

export class TerminalSpinnerService implements ITerminalSpinnerService {
	public createSpinner(
		spinnerOptions: ITerminalSpinnerOptions = {}
	): ITerminalSpinner {
		// @ts-expect-error - options are readonly, however we still want to override them before passing them on...
		spinnerOptions.stream = spinnerOptions.stream || process.stdout;
		return ora(spinnerOptions);
	}

	public async execute<T>(
		spinnerOptions: ITerminalSpinnerOptions,
		action: () => Promise<T>
	): Promise<T> {
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
injector.register("terminalSpinnerService", TerminalSpinnerService);
