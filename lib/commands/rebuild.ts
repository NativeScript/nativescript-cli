var Future = require("fibers/future");

// TODO: Use the injector for this
import { Project } from "../build/project";

export class RebuildCommand implements ICommand {
	constructor(private $projectData: IProjectData) {}

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): IFuture<void> {
		return (() => {
			console.log("Uptime at the start of RebuildCommand.execute: " + process.uptime());

			let project = new Project(this.$projectData.projectDir);
			project.rebuild();

		}).future<void>()();
	}

	public canExecute(args: string[]): IFuture<boolean> {
		return Future.fromResult(true);
	}
}
$injector.registerCommand("rebuild", RebuildCommand);