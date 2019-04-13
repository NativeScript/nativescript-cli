interface IGradleCommandService {
	executeCommand(gradleArgs: string[], options: IGradleCommandOptions): Promise<ISpawnResult>;
}

interface IGradleCommandOptions { 
	message?: string;
	cwd: string;
	stdio?: string;
	spawnOptions?: any;
}

interface IAndroidBuildConfig extends IRelease, IAndroidReleaseOptions, IHasAndroidBundle {
	buildOutputStdio?: string;
}

interface IGradleBuildService {
	buildProject(projectRoot: string, buildConfig: IAndroidBuildConfig): Promise<void>;
	cleanProject(projectRoot: string, buildConfig: IAndroidBuildConfig): Promise<void>;
}

interface IGradleBuildArgsService {
	getBuildTaskArgs(buildConfig: IAndroidBuildConfig): string[];
	getCleanTaskArgs(buildConfig: IAndroidBuildConfig): string[];
}