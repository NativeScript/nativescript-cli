import { IAndroidBuildData } from "./build";
import { ISpawnResult, ISpawnFromEventOptions } from "../common/declarations";

interface IGradleCommandService {
	executeCommand(
		gradleArgs: string[],
		options: IGradleCommandOptions
	): Promise<ISpawnResult>;
}

interface IGradleCommandOptions {
	cwd: string;
	message?: string;
	stdio?: string;
	spawnOptions?: ISpawnFromEventOptions;
}

interface IGradleBuildService {
	buildProject(
		projectRoot: string,
		buildData: IAndroidBuildData
	): Promise<void>;
	cleanProject(
		projectRoot: string,
		buildData: IAndroidBuildData
	): Promise<void>;
}

interface IGradleBuildArgsService {
	getBuildTaskArgs(buildData: IAndroidBuildData): Promise<string[]>;
	getCleanTaskArgs(buildData: IAndroidBuildData): string[];
}
