///<reference path="../.d.ts"/>
"use strict";

export class ProjectCommandParameter implements ICommandParameter {
	constructor(private $errors: IErrors,
		private $projectNameValidator: IProjectNameValidator) { }

	mandatory = true;
	validate(value: string): IFuture<boolean> {
		return (() => {
			if(!value) {
				this.$errors.fail("You must specify <App name> when creating a new project.");
			}

			return this.$projectNameValidator.validate(value);
		}).future<boolean>()();
	}
}

export class CreateProjectCommand implements ICommand {
	constructor(private $projectService: IProjectService,
		private $errors: IErrors,
		private $projectNameValidator: IProjectNameValidator) { }

	public enableHooks = false;

	execute(args: string[]): IFuture<void> {
		return (() => {
			this.$projectService.createProject(args[0]).wait();
		}).future<void>()();
	}

	allowedParameters = [new ProjectCommandParameter(this.$errors, this.$projectNameValidator) ]
}
$injector.registerCommand("create", CreateProjectCommand);
