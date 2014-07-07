///<reference path="../.d.ts"/>

export class CreateProjectCommand implements ICommand {
	constructor(private $projectService: IProjectService) { }

	execute(args: string[]): IFuture<void> {
		return (() => {
			var projectConfig = args[3] ? JSON.parse(args[3]) : {};
			this.$projectService.createProject(args[0], args[1], args[2], projectConfig).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("create", CreateProjectCommand);
