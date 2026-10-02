import { inject } from "../common/di/inject";
import type { Provider } from "../common/di/providers";
import {
	COMMAND_PRECONDITIONS,
	CommandPrecondition,
} from "../common/contracts/command-preconditions";
import type { IProjectData } from "../definitions/project";

/**
 * Declares that a command runs inside a project: the project the command line
 * names, through `--path` or the working directory, is resolved before the
 * command's setup and arguments policy, and its absence fails the invocation
 * with the "no project found" error. `inject(ProjectData)` then reads it.
 *
 * Without this declaration `inject(ProjectData)` hands back the process-wide
 * object uninitialised, so a command that wants the project only when there
 * is one resolves it behind its own check and initialises it there.
 */
export function provideProject(): Provider {
	return {
		provide: COMMAND_PRECONDITIONS,
		multi: true,
		useValue: requireProject,
	};
}

const requireProject: CommandPrecondition = () => {
	const projectData = inject<IProjectData>("projectData");
	if (typeof projectData.initializeProjectData === "function") {
		projectData.initializeProjectData();
	}
};
