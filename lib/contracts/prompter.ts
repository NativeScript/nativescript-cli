import { Contract } from "../common/di/contract";
import type {
	IAllowEmpty,
	IPrompterOptions,
	IPrompterQuestion,
} from "../common/declarations";

/**
 * Asks the user questions on the terminal.
 */
@Contract({ name: "prompter" })
export abstract class Prompter {
	/** Closes the Ctrl+C reader the prompter installs on stdin. */
	abstract dispose(): void;

	abstract get(schemas: IPrompterQuestion[]): Promise<any>;

	abstract getPassword(prompt: string, options?: IAllowEmpty): Promise<string>;

	abstract getString(
		prompt: string,
		options?: IPrompterOptions,
	): Promise<string>;

	abstract promptForChoice(
		promptMessage: string,
		choices:
			string[] | { title: string; description?: string; value?: string }[],
		multiple?: boolean,
		options?: any,
	): Promise<string>;

	abstract promptForDetailedChoice(
		promptMessage: string,
		choices: { key: string; description: string }[],
	): Promise<string>;

	abstract confirm(
		prompt: string,
		defaultAction?: () => boolean,
	): Promise<boolean>;
}
