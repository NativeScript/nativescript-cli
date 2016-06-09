import { isInteractive } from "../common/helpers";

export class ProjectNameService implements IProjectNameService {
	constructor(private $projectNameValidator: IProjectNameValidator,
		private $errors: IErrors,
		private $logger: ILogger,
		private $prompter: IPrompter) { }

	public ensureValidName(projectName: string, validateOptions?: { force: boolean }): IFuture<string> {
		return (() => {
			if (validateOptions && validateOptions.force) {
				return projectName;
			}

			if (!this.$projectNameValidator.validate(projectName)) {
				return this.promptForNewName("The project name is invalid.", projectName, validateOptions).wait();
			}

			let userCanInteract = isInteractive();

			if (!this.checkIfNameStartsWithLetter(projectName)) {
				if (!userCanInteract) {
					this.$errors.fail("The project name does not start with letter and will fail to build for Android. If You want to create project with this name add --force to the create command.");
				}

				return this.promptForNewName("The project name does not start with letter and will fail to build for Android.", projectName, validateOptions).wait();
			}

			if (projectName.toUpperCase() === "APP") {
				if (!userCanInteract) {
					this.$errors.fail("You cannot build applications named 'app' in Xcode. Consider creating a project with different name. If You want to create project with this name add --force to the create command.");
				}

				return this.promptForNewName("You cannot build applications named 'app' in Xcode. Consider creating a project with different name.", projectName, validateOptions).wait();
			}

			return projectName;
		}).future<string>()();
	}

	private checkIfNameStartsWithLetter(projectName: string): boolean {
		let startsWithLetterExpression = /^[a-zA-Z]/;
		return startsWithLetterExpression.test(projectName);
	}

	private promptForNewName(warningMessage: string, projectName: string, validateOptions?: { force: boolean }): IFuture<string> {
		return (() => {
			if (this.promptForForceNameConfirm(warningMessage).wait()) {
				return projectName;
			}

			let newProjectName = this.$prompter.getString("Enter the new project name:").wait();
			return this.ensureValidName(newProjectName, validateOptions).wait();
		}).future<string>()();
	}

	private promptForForceNameConfirm(warningMessage: string): IFuture<boolean> {
		return (() => {
			this.$logger.warn(warningMessage);

			return this.$prompter.confirm("Do you want to create the project with this name?").wait();
		}).future<boolean>()();
	}
}

$injector.register("projectNameService", ProjectNameService);
