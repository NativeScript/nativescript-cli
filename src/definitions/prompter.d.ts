import * as prompt from "inquirer";
import { IAllowEmpty, IDisposable, IPrompterOptions } from "../common/declarations";

declare global {
	interface IPrompter extends IDisposable {
		get(schemas: prompt.Question[]): Promise<any>;

		getPassword(prompt: string, options?: IAllowEmpty): Promise<string>;

		getString(prompt: string, options?: IPrompterOptions): Promise<string>;

		promptForChoice(promptMessage: string, choices: string[]): Promise<string>;

		promptForDetailedChoice(promptMessage: string, choices: { key: string, description: string }[]): Promise<string>;

		confirm(prompt: string, defaultAction?: () => boolean): Promise<boolean>;
	}
}
