import { Contract } from "../common/di/contract";

@Contract({ name: "projectNameService" })
export abstract class ProjectNameService {
	/**
	 * Ensures the passed project name is valid; prompts for action otherwise.
	 * @returns The selected name of the project.
	 */
	abstract ensureValidName(
		projectName: string,
		validateOptions?: { force: boolean },
	): Promise<string>;
}
