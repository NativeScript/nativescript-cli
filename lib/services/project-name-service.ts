import { isInteractive } from "../common/helpers";

export class ProjectNameService implements IProjectNameService {
	constructor(private $projectNameValidator: IProjectNameValidator,
		private $errors: IErrors,
		private $logger: ILogger,
		private $prompter: IPrompter) { }

	public async ensureValidName(projectName: string, validateOptions?: { force: boolean }): Promise<string> {
		if (validateOptions && validateOptions.force) {
			return projectName;
		}

		if (!this.$projectNameValidator.validate(projectName)) {
			return await this.promptForNewName("The project name is invalid.", projectName, validateOptions);
		}

		const userCanInteract = isInteractive();

		if (!this.checkIfNameStartsWithLetter(projectName)) {
			if (!userCanInteract) {
				this.$errors.failWithoutHelp("The project name does not start with letter and will fail to build for Android. If You want to create project with this name add --force to the create command.");
			}

			return await this.promptForNewName("The project name does not start with letter and will fail to build for Android.", projectName, validateOptions);
		}

		if (projectName.toUpperCase() === "APP") {
			if (!userCanInteract) {
				this.$errors.failWithoutHelp("You cannot build applications named 'app' in Xcode. Consider creating a project with different name. If You want to create project with this name add --force to the create command.");
			}

			return await this.promptForNewName("You cannot build applications named 'app' in Xcode. Consider creating a project with different name.", projectName, validateOptions);
		}

		return projectName;
	}

	private checkIfNameStartsWithLetter(projectName: string): boolean {
		const startsWithLetterExpression = /^[a-zA-Z]/;
		return startsWithLetterExpression.test(projectName);
	}

	private async promptForNewName(warningMessage: string, projectName: string, validateOptions?: { force: boolean }): Promise<string> {
		if (await this.promptForForceNameConfirm(warningMessage)) {
			return projectName;
		}

		const newProjectName = await this.$prompter.getString("Enter the new project name:");
		return await this.ensureValidName(newProjectName, validateOptions);
	}

	private async promptForForceNameConfirm(warningMessage: string): Promise<boolean> {
		this.$logger.warn(warningMessage);

		return await this.$prompter.confirm("Do you want to create the project with this name?");
	}
}

$injector.register("projectNameService", ProjectNameService);
