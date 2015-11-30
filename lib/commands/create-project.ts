///<reference path="../.d.ts"/>
"use strict";

export class ProjectCommandParameter implements ICommandParameter {
	constructor(private $errors: IErrors,
		private $logger: ILogger,
		private $projectNameValidator: IProjectNameValidator) { }

	mandatory = true;
	validate(value: string): IFuture<boolean> {
		return (() => {
			if(!value) {
				this.$errors.fail("You must specify <App name> when creating a new project.");
			}

			if (value.toUpperCase() === "APP") {
				this.$logger.warn("You cannot build applications named 'app' in Xcode. Consider creating a project with different name.");
			}

			return this.$projectNameValidator.validate(value);
		}).future<boolean>()();
	}
}

export class CreateProjectCommand implements ICommand {
	constructor(private $projectService: IProjectService,
		private $errors: IErrors,
		private $logger: ILogger,
		private $projectNameValidator: IProjectNameValidator,
		private $options: ICommonOptions) { }

	public enableHooks = false;

	execute(args: string[]): IFuture<void> {
		return (() => {
			this.$projectService.createProject(args[0], this.$options.template).wait();
		}).future<void>()();
	}

	allowedParameters = [new ProjectCommandParameter(this.$errors, this.$logger, this.$projectNameValidator) ];
}
$injector.registerCommand("create", CreateProjectCommand);
