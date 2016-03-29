"use strict";

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
				return this.promptForNewName(projectName, validateOptions).wait();
			}

			if (!this.checkIfNameStartsWithLetter(projectName)) {
				if (!isInteractive()) {
					this.$errors.fail("The project name does not start with letter and will fail to build for Android. If You want to create project with this name add --force to the create command.");
					return;
				}

				return this.promptForNewName(projectName, validateOptions).wait();
			}

			return projectName;
		}).future<string>()();
	}

	private checkIfNameStartsWithLetter(projectName: string): boolean {
		let startsWithLetterExpression = /^[a-zA-Z]/;
		return startsWithLetterExpression.test(projectName);
	}

	private promptForNewName(projectName: string, validateOptions?: { force: boolean }): IFuture<string> {
		return (() => {
			if (this.promptForForceNameConfirm().wait()) {
				return projectName;
			}

			let newProjectName = this.$prompter.getString("Enter the new project name:").wait();
			return this.ensureValidName(newProjectName, validateOptions).wait();
		}).future<string>()();
	}

	private promptForForceNameConfirm(): IFuture<boolean> {
		return (() => {
			this.$logger.warn("The project name does not start with letter and will fail to build for Android.");

			return this.$prompter.confirm("Do you want to create the project with this name?").wait();
		}).future<boolean>()();
	}
}

$injector.register("projectNameService", ProjectNameService);
