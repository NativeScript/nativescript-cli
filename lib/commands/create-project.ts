///<reference path="../.d.ts"/>

export class CreateProjectCommand implements ICommand {
	constructor(private $projectService: IProjectService) { }

	public enableHooks = false;

	execute(args: string[]): IFuture<void> {
		return (() => {
			this.$projectService.createProject(args[0]).wait();
		}).future<void>()();
	}
}
$injector.registerCommand("create", CreateProjectCommand);
