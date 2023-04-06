import type { Options, Ora } from "ora";

type ITerminalSpinnerOptions = Options;
type ITerminalSpinner = Ora;

interface ITerminalSpinnerService {
	createSpinner(spinnerOptions?: ITerminalSpinnerOptions): ITerminalSpinner;
	execute<T>(
		spinnerOptions: ITerminalSpinnerOptions,
		action: () => Promise<T>
	): Promise<T>;
}
