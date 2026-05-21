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
import { IProjectChangesInfo } from "../definitions/project-changes";

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

	private _platformData: IPlatformData | null = null;

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
				),
				platformProjectService: <any>this,
				projectRoot: projectRoot,
				getBuildOutputPath: (_options?: any): string => {
					return path.join(projectRoot, projectData.projectName, "bin");
				},
				getValidBuildOutputData: (): IValidBuildOutputData => {
					return {
						// AppxManifest.xml triggers Add-AppxPackage -Register (dev flow).
						// msix/appx handle release builds.
						packageNames: [
							"AppxManifest.xml",
							`${projectData.projectName}.msix`,
							`${projectData.projectName}.appx`,
						],
					};
				},
				configurationFileName: "Package.appxmanifest",
				frameworkDirectoriesExtensions: [],
				frameworkDirectoriesNames: ["metadata", "NativeScript", "internal"],
				targetedOS: ["win32"],
				relativeToFrameworkConfigurationFilePath: "app.config",
				fastLivesyncFileExtensions: [".jpg", ".jpeg", ".png", ".gif", ".bmp"],
			};
		}

		return this._platformData as IPlatformData;
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
			"Assets",
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

	public interpolateConfigurationFile(projectData: IProjectData): void {
		const platformData = this.getPlatformData(projectData);
		const manifestPath = path.join(
			platformData.projectRoot,
			projectData.projectName,
			"Package.appxmanifest",
		);
		if (!this.$fs.exists(manifestPath)) {
			return;
		}

		let content = fs.readFileSync(manifestPath, "utf8");
		const appId =
			projectData.projectIdentifiers?.["windows"] ?? projectData.projectId;
		if (appId) {
			content = content.split("__APP_IDENTIFIER__").join(appId);
		}
		content = content.split("__PROJECT_NAME__").join(projectData.projectName);
		this.$fs.writeFile(manifestPath, content);
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
		const outputPath = path.join(projectRoot, projectData.projectName, "bin");

		this.$logger.info(
			`Building Windows project: ${csproj} [${config}|${arch}]`,
		);

		const result = await this.$childProcess.spawnFromEvent(
			"dotnet",
			[
				"build",
				csproj,
				"-c",
				config,
				`-p:Platform=${arch}`,
				"--output",
				outputPath,
			],
			"close",
			{ cwd: path.join(projectRoot, projectData.projectName) },
			{ throwError: false },
		);

		if (result.stdout) {
			this.$logger.info(result.stdout);
		}
		if (result.exitCode !== 0) {
			throw new Error(
				`dotnet build failed (exit ${result.exitCode}):\n${result.stdout || result.stderr}`,
			);
		}

		// Add-AppxPackage -Register requires the manifest to be named AppxManifest.xml
		// with $targetnametoken$ expanded to the actual EXE name.
		const manifestSrc = path.join(
			projectRoot,
			projectData.projectName,
			"Package.appxmanifest",
		);
		const manifestDest = path.join(outputPath, "AppxManifest.xml");
		if (this.$fs.exists(manifestSrc)) {
			const raw = fs.readFileSync(manifestSrc, "utf8");
			const expanded = raw.split("$targetnametoken$").join(projectData.projectName);
			fs.writeFileSync(manifestDest, expanded, "utf8");
		}
	}

	public async prepareProject<T>(
		_projectData: IProjectData,
		_prepareData: T,
	): Promise<void> {
		// Stage native plugin sources into
		// platforms/windows/<ProjectName>/plugins/<plugin>/ and generate
		// Plugins.props / Plugins.targets that the template csproj imports.
		const projectData = _projectData;
		const pluginsService: any = injector.resolve("pluginsService");
		const platformData = this.getPlatformData(projectData);
		const appProjectDir = path.join(
			platformData.projectRoot,
			projectData.projectName,
		);

		// Attempt to run dotnet-tool to publish/copy DotNetBridge and app projects if available
		try {
			const marker = path.join(appProjectDir, "dotnet-bridge", "publish", ".dotnet_tool_done");
			if (fs.existsSync(marker)) {
				this.$logger.info("DotNetBridge publish marker found; skipping dotnet-tool");
			}
			else {
				const arch = process.arch === "arm64" ? "arm64" : "x64";
				const exeCandidates = [
					process.env.DOTNET_TOOL_PATH,
					path.join(platformData.projectRoot, "tools", `dotnet-tool-${arch}.exe`),
					path.join(platformData.projectRoot, "tools", "dotnet-tool.exe"),
				].filter(Boolean as any);
				let exePath: string | null = null;
				for (const p of exeCandidates) {
					if (p && fs.existsSync(p)) { exePath = p as string; break; }
				}
				if (exePath) {
					this.$logger.info(`Running dotnet-tool: ${exePath}`);
					try {

						const result = await this.$childProcess.spawnFromEvent(exePath, ["--app-root", platformData.projectRoot, "--dir", "app", "--force"], "close", { cwd: platformData.projectRoot }, { throwError: false });
						if (result && result.stdout) { this.$logger.info(result.stdout); }
					}
					catch (err) {
						this.$logger.warn(`dotnet-tool execution failed: ${err}`);
					}

					// Ensure sentinel exists: if publish/ contains DotNetBridge.dll, write marker so MSBuild waits succeed
					try {
						const markerPath = path.join(appProjectDir, "dotnet-bridge", "publish", ".dotnet_tool_done");
						if (!fs.existsSync(markerPath)) {
							const publishDir = path.join(appProjectDir, "dotnet-bridge", "publish");
							if (fs.existsSync(publishDir)) {
								const files = fs.readdirSync(publishDir);
								if (files && files.length > 0) {
									const bridgeDll = path.join(publishDir, "DotNetBridge.dll");
									if (fs.existsSync(bridgeDll)) {
										try {
											fs.writeFileSync(markerPath, "done", "utf8");
											this.$logger.info(`Created dotnet-tool marker at ${markerPath}`);
										}
										catch (werr) {
											this.$logger.warn(`Failed creating dotnet-tool marker: ${werr}`);
										}
									}
									else {
										this.$logger.info(`[NativeScript] publish directory exists but DotNetBridge.dll missing; files=${files.join(',')}`);
									}
								}
							}
							else {
								this.$logger.info(`[NativeScript] publish directory not found at ${publishDir}`);
							}
						}
					}
					catch (e) {
						this.$logger.warn(`dotnet-tool sentinel check failed: ${e}`);
					}
				}
			}
		}
		catch (err) {
			this.$logger.warn(`dotnet-tool check failed: ${err}`);
		}
		const pluginsDir = path.join(appProjectDir, "plugins");

		// Ensure plugins directory exists inside the platform app folder (where csproj expects it)
		if (!this.$fs.exists(pluginsDir)) {
			this.$fs.ensureDirectoryExists(pluginsDir);
		}

		// Discover installed plugins and stage their native artifacts
		const installedPlugins =
			await pluginsService.getAllInstalledPlugins(projectData);
		const manifest: any = {};
		const stagedPlugins: Array<{ name: string }> = [];

		for (const pluginData of installedPlugins) {
			try {
				await this.preparePluginNativeCode(pluginData, projectData);
				stagedPlugins.push({ name: pluginData.name });
				const stagedPath = path.join(pluginsDir, pluginData.name);
				const collect = (root: string) => {
					const out: string[] = [];
					if (!this.$fs.exists(root)) return out;
					const walk = (dir: string) => {
						for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
							const full = path.join(dir, e.name);
							if (e.isDirectory()) walk(full);
							else
								out.push(path.relative(root, full).split(path.sep).join("\\"));
						}
					};
					walk(root);
					return out;
				};
				const stagedFiles = collect(stagedPath);
				manifest[pluginData.name] = {
					stagedFiles,
					package: pluginData.nativescript || null,
				};
			} catch (err) {
				this.$logger.warn(
					`Failed to stage native files for plugin ${pluginData.name}: ${err}`,
				);
			}
		}

		// Write aggregate imports that the project csproj imports via "plugins\Plugins.props"
		const aggregatePropsPath = path.join(pluginsDir, "Plugins.props");
		const aggregateTargetsPath = path.join(pluginsDir, "Plugins.targets");
		const propsLines: string[] = [
			'<?xml version="1.0" encoding="utf-8"?>',
			"<Project>",
		];
		const targetsLines: string[] = [
			'<?xml version="1.0" encoding="utf-8"?>',
			"<Project>",
		];
		for (const p of stagedPlugins) {
			const pluginRelDir = p.name.split("/").join("\\");
			const importPathProps = `$(MSBuildThisFileDirectory)${pluginRelDir}\\plugin.props`;
			const importPathTargets = `$(MSBuildThisFileDirectory)${pluginRelDir}\\plugin.targets`;
			propsLines.push(
				`  <Import Project="${importPathProps}" Condition="Exists('${importPathProps}')" />`,
			);
			targetsLines.push(
				`  <Import Project="${importPathTargets}" Condition="Exists('${importPathTargets}')" />`,
			);
		}
		propsLines.push("</Project>");
		targetsLines.push("</Project>");
		this.$fs.writeFile(aggregatePropsPath, propsLines.join("\n"));
		this.$fs.writeFile(aggregateTargetsPath, targetsLines.join("\n"));

		// Write installed.json for incremental/uninstall support
		const installedJsonPath = path.join(pluginsDir, "installed.json");
		this.$fs.writeJson(installedJsonPath, manifest);
	}

	public async checkForChanges(
		_changesInfo: IProjectChangesInfo,
		_prepareData: IPrepareData,
		_projectData: IProjectData,
	): Promise<void> {
		// Windows currently has no extra checks. This method exists so the
		// ProjectChangesService can call it uniformly for all platforms.
		return;
	}

	public prepareAppResources(projectData: IProjectData): void {
		// Copy app-level Windows resources into the platform project. We preserve
		// the original `App_Resources/Windows` layout (so imports like
		// App_Resources\Windows\app.csproj work) and additionally stage any
		// `Assets` subfolder into the project `Assets` directory (where the
		// manifest expects images).
		const projectRoot = projectData.projectDir;
		const candidates = [
			path.join(projectRoot, "App_Resources", "Windows"),
			path.join(projectRoot, "App_Resources", "windows"),
			path.join(projectRoot, "app", "App_Resources", "Windows"),
			path.join(projectRoot, "app", "App_Resources", "windows"),
		];
		let srcRoot: string | null = null;
		for (const c of candidates) {
			if (this.$fs.exists(c)) {
				srcRoot = c;
				break;
			}
		}
		if (!srcRoot) return;

		const platformData = this.getPlatformData(projectData);
		const platformAppDir = path.join(
			platformData.projectRoot,
			projectData.projectName,
		);

		// Copy App_Resources/Windows -> platforms/windows/<Project>/App_Resources/Windows
		const destAppResourcesWindows = path.join(
			platformAppDir,
			"App_Resources",
			"Windows",
		);
		this.$fs.ensureDirectoryExists(destAppResourcesWindows);

		const copyRecursive = (srcDir: string, destDir: string) => {
			const entries = fs.readdirSync(srcDir, { withFileTypes: true });
			for (const e of entries) {
				const srcPath = path.join(srcDir, e.name);
				const destPath = path.join(destDir, e.name);
				if (e.isDirectory()) {
					this.$fs.ensureDirectoryExists(destPath);
					copyRecursive(srcPath, destPath);
				} else if (e.isFile()) {
					this.$fs.copyFile(srcPath, destPath);
				}
			}
		};

		copyRecursive(srcRoot, destAppResourcesWindows);

		// If the app resources include an Assets folder, stage its contents into the project Assets folder
		const srcAssets = path.join(srcRoot, "Assets");
		if (this.$fs.exists(srcAssets)) {
			const destAssets = path.join(platformAppDir, "Assets");
			this.$fs.ensureDirectoryExists(destAssets);
			copyRecursive(srcAssets, destAssets);
		}

		// If there's a Package.appxmanifest in App_Resources/Windows, copy and interpolate it into the project root
		const manifestInSrc = path.join(srcRoot, "Package.appxmanifest");
		if (this.$fs.exists(manifestInSrc)) {
			const destManifest = path.join(platformAppDir, "Package.appxmanifest");
			this.$fs.copyFile(manifestInSrc, destManifest);
			this.interpolateConfigurationFile(projectData);
		}
	}

	public isPlatformPrepared(
		projectRoot: string,
		projectData: IProjectData,
	): boolean {
		return this.$fs.exists(path.join(projectRoot, projectData.projectName));
	}

	public async preparePluginNativeCode(
		pluginData: IPluginData,
		projectData: IProjectData,
	): Promise<void> {
		// Stage native files found under the plugin's platforms/windows folder into
		// the app's plugins directory so the csproj can import them.
		const platformFolder = path.join(
			pluginData.fullPath,
			"platforms",
			"windows",
		);
		const fallbackFolder = path.join(pluginData.fullPath, "windows");
		const sourcesFolder = this.$fs.exists(platformFolder)
			? platformFolder
			: this.$fs.exists(fallbackFolder)
				? fallbackFolder
				: null;
		if (!sourcesFolder) {
			return;
		}

		if (!projectData) {
			return;
		}

		const platformData = this.getPlatformData(projectData);
		const appProjectDir = path.join(
			platformData.projectRoot,
			projectData.projectName,
		);
		const pluginStageDir = path.join(appProjectDir, "plugins", pluginData.name);
		this.$fs.ensureDirectoryExists(pluginStageDir);

		// recursively copy native files (exclude JS/TS/JSON)
		const walk = (dir: string) => {
			const entries = fs.readdirSync(dir, { withFileTypes: true });
			for (const e of entries) {
				const src = path.join(dir, e.name);
				const rel = path.relative(sourcesFolder, src);
				const dest = path.join(pluginStageDir, rel);
				if (e.isDirectory()) {
					this.$fs.ensureDirectoryExists(dest);
					walk(src);
				} else if (e.isFile()) {
					const ext = path.extname(e.name).toLowerCase();
					if (
						ext === ".js" ||
						ext === ".ts" ||
						ext === ".json" ||
						ext === ".map" ||
						ext === ".md"
					)
						continue;
					this.$fs.ensureDirectoryExists(path.dirname(dest));
					fs.copyFileSync(src, dest);
				}
			}
		};

		walk(sourcesFolder);

		// copy provided plugin.props/targets if present in plugin root
		const providedProps = path.join(pluginData.fullPath, "plugin.props");
		const providedTargets = path.join(pluginData.fullPath, "plugin.targets");
		if (this.$fs.exists(providedProps)) {
			this.$fs.copyFile(
				providedProps,
				path.join(pluginStageDir, "plugin.props"),
			);
		}
		if (this.$fs.exists(providedTargets)) {
			this.$fs.copyFile(
				providedTargets,
				path.join(pluginStageDir, "plugin.targets"),
			);
		}

		const collectStagedFiles = (root: string): string[] => {
			const out: string[] = [];
			if (!this.$fs.exists(root)) return out;
			const walk = (dir: string) => {
				for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
					const full = path.join(dir, e.name);
					if (e.isDirectory()) walk(full);
					else out.push(path.relative(root, full).split(path.sep).join("\\"));
				}
			};
			walk(root);
			return out;
		};

		// generate plugin.props if not provided
		if (!this.$fs.exists(path.join(pluginStageDir, "plugin.props"))) {
			const stagedFiles = collectStagedFiles(pluginStageDir);
			const lines: string[] = [
				'<?xml version="1.0" encoding="utf-8"?>',
				"<Project>",
				"  <ItemGroup>",
			];
			for (const f of stagedFiles) {
				const rel = f.split(path.sep).join("\\");
				const link = `plugins\\${pluginData.name}\\${rel}`;
				lines.push(`    <Content Include="$(MSBuildThisFileDirectory)${rel}">`);
				lines.push(`      <Link>${link}</Link>`);
				lines.push(
					"      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>",
				);
				lines.push("    </Content>");
			}
			lines.push("  </ItemGroup>");
			lines.push("</Project>");
			this.$fs.writeFile(
				path.join(pluginStageDir, "plugin.props"),
				lines.join("\n"),
			);
		}

		// generate plugin.targets if not provided — uses an explicit Copy task so
		// that DLLs reach bin/ even when EnableMsixTooling=true intercepts Content items.
		if (!this.$fs.exists(path.join(pluginStageDir, "plugin.targets"))) {
			const stagedFiles = collectStagedFiles(pluginStageDir);
			if (stagedFiles.length > 0) {
				const safeName = pluginData.name.replace(/[^a-zA-Z0-9]/g, "_");
				const pluginOutDir = `plugins\\${pluginData.name.split("/").join("\\")}`;
				const lines: string[] = [
					'<?xml version="1.0" encoding="utf-8"?>',
					"<Project>",
					`  <Target Name="CopyPlugin_${safeName}" AfterTargets="Build">`,
					`    <MakeDir Directories="$(OutDir)${pluginOutDir}" />`,
				];
				for (const f of stagedFiles) {
					const rel = f.split(path.sep).join("\\");
					lines.push(
						`    <Copy SourceFiles="$(MSBuildThisFileDirectory)${rel}"`,
					);
					lines.push(
						`          DestinationFiles="$(OutDir)${pluginOutDir}\\${rel}"`,
					);
					lines.push(`          SkipUnchangedFiles="true" />`);
				}
				lines.push("  </Target>");
				lines.push("</Project>");
				this.$fs.writeFile(
					path.join(pluginStageDir, "plugin.targets"),
					lines.join("\n"),
				);
			}
		}
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
		projectData: IProjectData,
	): void {
		// If the project provides a Package.appxmanifest under App_Resources/Windows,
		// copy it into the platform project so the build picks it up.
		const projectRoot = projectData.projectDir;
		const candidates = [
			path.join(
				projectRoot,
				"App_Resources",
				"Windows",
				"Package.appxmanifest",
			),
			path.join(
				projectRoot,
				"App_Resources",
				"windows",
				"Package.appxmanifest",
			),
			path.join(
				projectRoot,
				"app",
				"App_Resources",
				"Windows",
				"Package.appxmanifest",
			),
			path.join(
				projectRoot,
				"app",
				"App_Resources",
				"windows",
				"Package.appxmanifest",
			),
		];
		let src: string | null = null;
		for (const c of candidates) {
			if (this.$fs.exists(c)) {
				src = c;
				break;
			}
		}
		if (!src) return;

		const dest = path.join(
			this.getPlatformData(projectData).projectRoot,
			projectData.projectName,
			"Package.appxmanifest",
		);
		this.$fs.copyFile(src, dest);
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
