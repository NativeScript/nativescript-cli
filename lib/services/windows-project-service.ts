import * as path from "path";
import * as shell from "shelljs";
import * as constants from "../constants";
import { Configurations } from "../common/constants";
import * as projectServiceBaseLib from "./platform-project-service-base";
import * as fs from "fs";
import {
	IPlatformData,
	IValidBuildOutputData,
	IPlatformEnvironmentRequirements,
} from "../definitions/platform";
import {
	IProjectData,
	IProjectDataService,
	IValidatePlatformOutput,
} from "../definitions/project";
import { IOptions, IDependencyData } from "../declarations";
import { IPluginData } from "../definitions/plugins";
import {
	IFileSystem,
	IChildProcess,
	IRelease,
	ISpawnResult,
} from "../common/declarations";
import { injector } from "../common/yok";
import { INotConfiguredEnvOptions } from "../common/definitions/commands";

export class WindowsProjectService
	extends projectServiceBaseLib.PlatformProjectServiceBase
{
	private static WINDOWS_PLATFORM_NAME = "windows";

	constructor(
		$fs: IFileSystem,
		$projectDataService: IProjectDataService,
		private $options: IOptions,
		private $logger: ILogger,
		private $childProcess: IChildProcess,
		private $platformEnvironmentRequirements: IPlatformEnvironmentRequirements,
	) {
		super($fs, $projectDataService);
	}

	private _platformData: IPlatformData = null;

	public getPlatformData(projectData: IProjectData): IPlatformData {
		if (!projectData && !this._platformData) {
			throw new Error(
				"First call of getPlatformData without providing projectData.",
			);
		}

		if (projectData && projectData.platformsDir) {
			const projectRoot = this.$options.hostProjectPath
				? this.$options.hostProjectPath
				: path.join(
						projectData.platformsDir,
						WindowsProjectService.WINDOWS_PLATFORM_NAME,
					);

			const runtimePackage = this.$projectDataService.getRuntimePackage(
				projectData.projectDir,
				constants.PlatformTypes.windows,
			);

			this._platformData = {
				frameworkPackageName: runtimePackage?.name ?? "@nativescript/windows",
				normalizedPlatformName: "Windows",
				platformNameLowerCase: "windows",
				appDestinationDirectoryPath: path.join(
					projectRoot,
					projectData.projectName,
					"App",
				),
				platformProjectService: <any>this,
				projectRoot: projectRoot,
				getBuildOutputPath: (options: any): string => {
					const config = options?.release
						? Configurations.Release
						: Configurations.Debug;
					return path.join(projectRoot, constants.BUILD_DIR, config);
				},
				getValidBuildOutputData: (): IValidBuildOutputData => {
					return {
						packageNames: [
							`${projectData.projectName}.msix`,
							`${projectData.projectName}.appx`,
						],
					};
				},
				frameworkDirectoriesExtensions: [],
				frameworkDirectoriesNames: ["metadata", "NativeScript", "internal"],
				targetedOS: ["win32"],
				relativeToFrameworkConfigurationFilePath: "app.config",
				fastLivesyncFileExtensions: [".jpg", ".jpeg", ".png", ".gif", ".bmp"],
			};
		}

		return this._platformData;
	}

	public async validateOptions(
		_projectId?: string,
		_provision?: true | string,
		_teamId?: true | string,
	): Promise<boolean> {
		return true;
	}

	public getAppResourcesDestinationDirectoryPath(
		projectData: IProjectData,
	): string {
		return path.join(
			this.getPlatformData(projectData).projectRoot,
			projectData.projectName,
			"App_Resources",
		);
	}

	public async validate(
		projectData: IProjectData,
		options: IOptions,
		notConfiguredEnvOptions?: INotConfiguredEnvOptions,
	): Promise<IValidatePlatformOutput> {
		const checkEnvironmentRequirementsOutput =
			await this.$platformEnvironmentRequirements.checkEnvironmentRequirements({
				platform: this.getPlatformData(projectData).normalizedPlatformName,
				projectDir: projectData.projectDir,
				options,
				notConfiguredEnvOptions,
			});

		return { checkEnvironmentRequirementsOutput };
	}

	public async createProject(
		frameworkDir: string,
		_frameworkVersion: string,
		projectData: IProjectData,
	): Promise<void> {
		this.$fs.ensureDirectoryExists(
			this.getPlatformData(projectData).projectRoot,
		);
		shell.cp(
			"-R",
			path.join(frameworkDir, "*"),
			this.getPlatformData(projectData).projectRoot,
		);
	}

	public async interpolateData(projectData: IProjectData): Promise<void> {
		const projectRoot = this.getPlatformData(projectData).projectRoot;
		const placeholder = "__PROJECT_NAME__";
		const name = projectData.projectName;
		const appId =
			projectData.projectIdentifiers?.["windows"] ?? projectData.projectId;

		const templateDir = path.join(projectRoot, placeholder);
		const projectDir = path.join(projectRoot, name);

		if (this.$fs.exists(templateDir)) {
			this.$fs.rename(templateDir, projectDir);
		}

		if (!this.$fs.exists(projectDir)) {
			return;
		}

		const csprojPlaceholder = path.join(projectDir, `${placeholder}.csproj`);
		const csprojDest = path.join(projectDir, `${name}.csproj`);
		if (this.$fs.exists(csprojPlaceholder)) {
			this.$fs.rename(csprojPlaceholder, csprojDest);
		}

		this._replaceInFiles(projectDir, placeholder, name);
		if (appId) {
			this._replaceInFiles(projectDir, "__APP_IDENTIFIER__", appId);
		}
	}

	private _replaceInFiles(dir: string, from: string, to: string): void {
		const textExtensions = new Set([
			".cs",
			".csproj",
			".xaml",
			".xml",
			".json",
			".appxmanifest",
		]);
		const entries = fs.readdirSync(dir, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				this._replaceInFiles(fullPath, from, to);
			} else if (textExtensions.has(path.extname(entry.name).toLowerCase())) {
				const content = fs.readFileSync(fullPath, "utf8");
				if (content.includes(from)) {
					fs.writeFileSync(fullPath, content.split(from).join(to), "utf8");
				}
			}
		}
	}

	public interpolateConfigurationFile(_projectData: IProjectData): void {
		// no-op for Windows
	}

	public afterCreateProject(
		_projectRoot: string,
		_projectData: IProjectData,
	): void {
		// no-op for Windows
	}

	public async buildProject(
		projectRoot: string,
		projectData: IProjectData,
		buildConfig: any,
	): Promise<void> {
		const config = buildConfig?.release
			? Configurations.Release
			: Configurations.Debug;
		const arch = buildConfig?.architectures?.[0] ?? "x64";
		const csproj = path.join(
			projectRoot,
			projectData.projectName,
			`${projectData.projectName}.csproj`,
		);

		this.$logger.info(
			`Building Windows project: ${csproj} [${config}|${arch}]`,
		);

		await this.$childProcess.spawnFromEvent(
			"msbuild",
			[csproj, `/p:Configuration=${config}`, `/p:Platform=${arch}`],
			"close",
			{ cwd: path.join(projectRoot, projectData.projectName) },
			{ throwError: true },
		);
	}

	public async prepareProject<T>(
		_projectData: IProjectData,
		_prepareData: T,
	): Promise<void> {
		// no-op for Windows
	}

	public prepareAppResources(_projectData: IProjectData): void {
		// no-op for Windows
	}

	public isPlatformPrepared(
		projectRoot: string,
		projectData: IProjectData,
	): boolean {
		return this.$fs.exists(path.join(projectRoot, projectData.projectName));
	}

	public async preparePluginNativeCode(
		_pluginData: IPluginData,
		_options?: any,
	): Promise<void> {
		// no-op for Windows
	}

	public async removePluginNativeCode(
		_pluginData: IPluginData,
		_projectData: IProjectData,
	): Promise<void> {
		// no-op for Windows
	}

	public async beforePrepareAllPlugins(
		_projectData: IProjectData,
		dependencies?: IDependencyData[],
	): Promise<IDependencyData[]> {
		return dependencies ?? [];
	}

	public async handleNativeDependenciesChange(
		_projectData: IProjectData,
		_opts: IRelease,
	): Promise<void> {
		// no-op for Windows
	}

	public async cleanDeviceTempFolder(
		_deviceIdentifier: string,
		_projectData: IProjectData,
	): Promise<void> {
		// no-op for Windows
	}

	public async processConfigurationFilesFromAppResources(
		_projectData: IProjectData,
		_opts: { release: boolean },
	): Promise<void> {
		// no-op for Windows
	}

	public ensureConfigurationFileInAppResources(
		_projectData: IProjectData,
	): void {
		// no-op for Windows
	}

	public async stopServices(_projectRoot: string): Promise<ISpawnResult> {
		return { stderr: "", stdout: "", exitCode: 0 };
	}

	public async cleanProject(projectRoot: string): Promise<void> {
		const buildDir = path.join(projectRoot, constants.BUILD_DIR);
		if (this.$fs.exists(buildDir)) {
			this.$fs.deleteDirectory(buildDir);
		}
	}
}
injector.register("windowsProjectService", WindowsProjectService);
