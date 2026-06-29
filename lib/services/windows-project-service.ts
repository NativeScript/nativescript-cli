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

function isGuid(s: string): boolean {
	return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s);
}

function generateGuid(): string {
	try {
		// prefer crypto.randomUUID when available
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const crypto = require("crypto");
		if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
		const b: Buffer = crypto.randomBytes(16);
		b[6] = (b[6] & 0x0f) | 0x40;
		b[8] = (b[8] & 0x3f) | 0x80;
		const hex = Array.from(b).map((n) => n.toString(16).padStart(2, "0")).join("");
		return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
	} catch (e) {
		const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
		return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4() + s4() + s4()}`;
	}
}

function generateDeterministicGuidFromString(s: string): string {
	try {
 		// Use SHA-1 digest of the string to produce a deterministic 16-byte value
 		// and format it as a RFC4122 v5-style UUID (version 5, variant RFC4122).
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const crypto = require("crypto");
		const hash = crypto.createHash("sha1").update(s).digest();
		const b = Buffer.from(hash.slice(0, 16));
		// set version to 5
		b[6] = (b[6] & 0x0f) | 0x50;
		// set variant to RFC4122
		b[8] = (b[8] & 0x3f) | 0x80;
		const hex = Array.from(b).map((n) => n.toString(16).padStart(2, "0")).join("");
		return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
	} catch (e) {
		return generateGuid();
	}
}

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
				getBuildOutputPath: (options?: any): string => {
					// Release builds are packaged into AppPackages/ (.msix/.msixupload),
					// while debug builds run from the plain `dotnet build` output in bin/.
					if (options?.release) {
						return path.join(
							projectRoot,
							projectData.projectName,
							"AppPackages",
						);
					}
					return path.join(projectRoot, projectData.projectName, "bin");
				},
				getValidBuildOutputData: (
					options?: any,
				): IValidBuildOutputData => {
					if (options?.release) {
						// Packaged artifacts live in versioned subfolders of AppPackages/
						// (e.g. App_1.0.0.0_x64_Test/App_1.0.0.0_x64.msix), so match by
						// extension rather than an exact file name. A representative
						// package name is kept so callers that read packageNames[0]
						// (e.g. for error messages) have a valid value.
						return {
							packageNames: [
								`${projectData.projectName}.msixupload`,
								`${projectData.projectName}.msix`,
							],
							regexes: [
								/\.(msixupload|appxupload|msixbundle|appxbundle|msix|appx)$/i,
							],
						};
					}
					// AppxManifest.xml triggers Add-AppxPackage -Register (dev flow).
					return {
						packageNames: ["AppxManifest.xml"],
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
		const projectRoot = this.getPlatformData(projectData).projectRoot;
		this.$fs.ensureDirectoryExists(projectRoot);
		const name = projectData.projectName;
		const entries = fs.readdirSync(frameworkDir, { withFileTypes: true });
		for (const entry of entries) {
			const srcPath = path.join(frameworkDir, entry.name);
			if (entry.name === "__PROJECT_NAME__") {
				const destPath = path.join(projectRoot, name);
				shell.cp("-R", srcPath, destPath);
			} else {
				const destPath = path.join(projectRoot, entry.name);
				shell.cp("-R", srcPath, destPath);
			}
		}
	}

	public async interpolateData(projectData: IProjectData): Promise<void> {
		const projectRoot = this.getPlatformData(projectData).projectRoot;
		const placeholder = "__PROJECT_NAME__";
		const name = projectData.projectName;
		const appId =
			projectData.projectIdentifiers?.["windows"] ?? projectData.projectId;

		const projectDir = path.join(projectRoot, name);

		const clearReadOnlyRecursive = (dir: string): void => {
			try {
				const entries = fs.readdirSync(dir, { withFileTypes: true });
				for (const entry of entries) {
					const fullPath = path.join(dir, entry.name);
					fs.chmodSync(fullPath, 0o666);
					if (entry.isDirectory()) {
						clearReadOnlyRecursive(fullPath);
					}
				}
				fs.chmodSync(dir, 0o666);
			} catch (e) {
				// ignore
			}
		};

		if (process.platform === "win32" && this.$fs.exists(projectDir)) {
			clearReadOnlyRecursive(projectDir);
		}

		const renameWithRetry = async (from: string, to: string): Promise<void> => {
			let retries = 30;
			while (retries > 0) {
				try {
					fs.renameSync(from, to);
					return;
				} catch (err: any) {
					if ((err.code === "EPERM" || err.code === "EBUSY") && retries > 1) {
						retries--;
						console.warn(`Rename failed, retrying... (${retries} retries left): ${err.message}`);
						await new Promise((resolve) => setTimeout(resolve, 300));
					} else {
						throw err;
					}
				}
			}
		};

		if (!this.$fs.exists(projectDir)) {
			return;
		}

		const csprojPlaceholder = path.join(projectDir, `${placeholder}.csproj`);
		const csprojDest = path.join(projectDir, `${name}.csproj`);
		if (this.$fs.exists(csprojPlaceholder)) {
			await renameWithRetry(csprojPlaceholder, csprojDest);
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
		const isRelease = !!buildConfig?.release;
		const config = isRelease ? Configurations.Release : Configurations.Debug;
		const arch = buildConfig?.architectures?.[0] ?? "x64";
		const csproj = path.join(
			projectRoot,
			projectData.projectName,
			`${projectData.projectName}.csproj`,
		);
		const outputPath = path.join(projectRoot, projectData.projectName, "bin");
		const appPackagesDir = path.join(
			projectRoot,
			projectData.projectName,
			"AppPackages",
		);

		this.$logger.info(
			`Building Windows project: ${csproj} [${config}|${arch}]${
				isRelease ? " (release package)" : ""
			}`,
		);

		// If the app project provides an App_Resources/Windows/Package.appxmanifest,
		// pass its path to MSBuild so Directory.Build.targets in the template can
		// merge app-level manifest fragments at build time. We prefer the first
		// candidate that exists in the app project layout. Also honor
		// `nsConfig.appResourcesPath` and the manifest prepared into the
		// platform project by `prepareAppResources` so custom paths are respected.
		const appManifestCandidates: string[] = [];
		// Prefer the manifest that was staged into the platform project (prepare step)
		appManifestCandidates.push(path.join(projectRoot, projectData.projectName, "Package.appxmanifest"));
		const cfgAppResources = projectData?.nsConfig?.appResourcesPath ?? null;
		if (cfgAppResources) {
			const resolved = path.isAbsolute(cfgAppResources)
				? cfgAppResources
				: path.join(projectData.projectDir, cfgAppResources);
			appManifestCandidates.push(path.join(resolved, "Windows", "Package.appxmanifest"));
			appManifestCandidates.push(path.join(resolved, "windows", "Package.appxmanifest"));
		}
		// Fallback to default locations inside the app project
		appManifestCandidates.push(path.join(projectData.projectDir, "App_Resources", "Windows", "Package.appxmanifest"));
		appManifestCandidates.push(path.join(projectData.projectDir, "App_Resources", "windows", "Package.appxmanifest"));
		appManifestCandidates.push(path.join(projectData.projectDir, "app", "App_Resources", "Windows", "Package.appxmanifest"));
		appManifestCandidates.push(path.join(projectData.projectDir, "app", "App_Resources", "windows", "Package.appxmanifest"));

		let appResourcesManifestArg: string | null = null;
		for (const candidate of appManifestCandidates) {
			if (this.$fs.exists(candidate)) {
				// dotnet/msbuild accepts -p:Property=Value syntax; quote the value
				// to handle paths that contain spaces.
				appResourcesManifestArg = `-p:AppResourcesManifestPath=\"${candidate}\"`;
				break;
			}
		}

		const dotnetArgs = ["build", csproj, "-c", config, `-p:Platform=${arch}`];

		if (isRelease) {
			// Produce an MSIX package (sideload-signed by default) or a Microsoft
			// Store upload bundle when --store-upload is passed, instead of a plain
			// run-from-bin build.
			const storeUpload = !!buildConfig?.storeUpload;
			const bundle = !!buildConfig?.msixBundle || storeUpload;
			const certificate: string = buildConfig?.certificate;
			const certificatePassword: string = buildConfig?.certificatePassword;
			const certificateThumbprint: string =
				buildConfig?.certificateThumbprint;

			dotnetArgs.push(
				"-p:GenerateAppxPackageOnBuild=true",
				`-p:AppxPackageDir=${appPackagesDir}${path.sep}`,
				`-p:UapAppxPackageBuildMode=${
					storeUpload ? "StoreUpload" : "SideloadOnly"
				}`,
				`-p:AppxBundle=${bundle ? "Always" : "Never"}`,
			);

			if (bundle) {
				dotnetArgs.push(`-p:AppxBundlePlatforms=${arch}`);
			}

			if (storeUpload) {
				// The Store re-signs the package on submission, so don't sign locally.
				dotnetArgs.push("-p:AppxPackageSigningEnabled=false");
			} else if (certificateThumbprint) {
				dotnetArgs.push(
					"-p:AppxPackageSigningEnabled=true",
					`-p:PackageCertificateThumbprint=${certificateThumbprint}`,
				);
			} else if (certificate) {
				const certPath = path.isAbsolute(certificate)
					? certificate
					: path.join(projectData.projectDir, certificate);
				dotnetArgs.push(
					"-p:AppxPackageSigningEnabled=true",
					`-p:PackageCertificateKeyFile=\"${certPath}\"`,
				);
				if (certificatePassword) {
					dotnetArgs.push(
						`-p:PackageCertificatePassword=${certificatePassword}`,
					);
				}
			} else {
				// No signing material provided — emit an unsigned package.
				dotnetArgs.push("-p:AppxPackageSigningEnabled=false");
			}
		} else {
			dotnetArgs.push("--output", outputPath);
		}

		if (appResourcesManifestArg) {
			dotnetArgs.push(appResourcesManifestArg);
		}

		const result = await this.$childProcess.spawnFromEvent(
			"dotnet",
			dotnetArgs,
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
		// with $targetnametoken$ expanded to the actual EXE name. This is only used by
		// the dev (debug) register flow; release builds produce a packaged .msix.
		const manifestSrc = path.join(
			projectRoot,
			projectData.projectName,
			"Package.appxmanifest",
		);
		const manifestDest = path.join(outputPath, "AppxManifest.xml");
		if (!isRelease && this.$fs.exists(manifestSrc)) {
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
		// Respect project-level `appResourcesPath` from nativescript.config.ts if present
		const candidates: string[] = [];
		const cfgAppResources = projectData && projectData.nsConfig && projectData.nsConfig.appResourcesPath ? projectData.nsConfig.appResourcesPath : null;
		if (cfgAppResources) {
			const resolved = path.isAbsolute(cfgAppResources)
				? cfgAppResources
				: path.join(projectData.projectDir, cfgAppResources);
			candidates.push(path.join(resolved, "Windows"));
			candidates.push(path.join(resolved, "windows"));
		}
		// Fallback to default locations
		candidates.push(path.join(projectRoot, "App_Resources", "Windows"));
		candidates.push(path.join(projectRoot, "App_Resources", "windows"));
		candidates.push(path.join(projectRoot, "app", "App_Resources", "Windows"));
		candidates.push(path.join(projectRoot, "app", "App_Resources", "windows"));
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
			// Read and potentially patch the manifest using windows config from nativescript config or CLI flags
			let manifestContent = fs.readFileSync(manifestInSrc, "utf8");
			const windowsCfg: any = projectData?.nsConfig?.windows ?? null;
			const phoneProductIdArg = (this.$options && (this.$options as any).phoneProductId) || (windowsCfg && (windowsCfg.PhoneProductId || windowsCfg.phoneProductId)) || null;
			const phonePublisherIdArg = (this.$options && (this.$options as any).phonePublisherId) || (windowsCfg && (windowsCfg.PhonePublisherId || windowsCfg.phonePublisherId)) || null;
			const regenGuid = !!(this.$options && (this.$options as any).regenGuid);
			const noAutoGuid = !!(this.$options && (this.$options as any).noAutoGuid);
			const allowZeroGuid = !!(this.$options && (this.$options as any).allowZeroGuid);
			const zeroGuid = "00000000-0000-0000-0000-000000000000";

			let modified = manifestContent;
			const phoneIdentityRegex = /<mp:PhoneIdentity\b([^>]*)\/>/i;
			if (phoneIdentityRegex.test(modified)) {
				if (phoneProductIdArg) {
					if (/(PhoneProductId\s*=\s*")[^"]*(")/i.test(modified)) {
						modified = modified.replace(/(PhoneProductId\s*=\s*")([^\"]*)(\")/i, `$1${phoneProductIdArg}$3`);
					} else {
						modified = modified.replace(phoneIdentityRegex, `<mp:PhoneIdentity$1 PhoneProductId="${phoneProductIdArg}" />`);
					}
				} else {
					const prodMatch = modified.match(/PhoneProductId\s*=\s*"([^\"]*)"/i);
					const prodValue = prodMatch ? prodMatch[1] : null;
					const prodIsZero = prodValue === zeroGuid;
					// Derive an app-specific identifier if available
					let appIdentifier = projectData && projectData.projectIdentifiers && projectData.projectIdentifiers["windows"] ? projectData.projectIdentifiers["windows"] : projectData.projectId;
					// try to discover id from nativescript.config/package.json if not present on projectData
					if (!appIdentifier) {
						try {
							const cfgCandidates = [
								path.join(projectData.projectDir, "nativescript.config.ts"),
								path.join(projectData.projectDir, "nativescript.config.js"),
								path.join(projectData.projectDir, "app", "nativescript.config.ts"),
								path.join(projectData.projectDir, "app", "nativescript.config.js"),
							];
							for (const c of cfgCandidates) {
								if (this.$fs.exists(c)) {
									try {
										const raw = fs.readFileSync(c, "utf8");
										const m = raw.match(/id\s*:\s*['\"]([^'\"]+)['\"]/i);
										if (m && m[1]) { appIdentifier = m[1]; break; }
									}
									catch (e) { }
								}
							}
						}
						catch (e) { }
					}
					if (allowZeroGuid) {
						if (prodMatch) {
							modified = modified.replace(/(PhoneProductId\s*=\s*")([^\"]*)(\")/i, `$1${zeroGuid}$3`);
						} else {
							modified = modified.replace(phoneIdentityRegex, `<mp:PhoneIdentity$1 PhoneProductId="${zeroGuid}" />`);
						}
						if (this.$logger && typeof (this.$logger.warn) === "function") {
							this.$logger.warn("Using zero PhoneProductId because --allow-zero-guid was provided.");
						}
					} else if (regenGuid) {
						const newGuid = generateGuid();
						if (prodMatch) {
							modified = modified.replace(/(PhoneProductId\s*=\s*")([^\"]*)(\")/i, `$1${newGuid}$3`);
						} else {
							modified = modified.replace(phoneIdentityRegex, `<mp:PhoneIdentity$1 PhoneProductId="${newGuid}" />`);
						}
					} else if (!prodValue || !isGuid(prodValue) || prodIsZero) {
						// treat missing, non-GUID, or all-zero GUID as placeholders
						if (!noAutoGuid) {
							let newGuid: string;
							if (appIdentifier) {
								newGuid = generateDeterministicGuidFromString(appIdentifier);
							} else {
								newGuid = generateGuid();
							}
							if (prodMatch) {
								modified = modified.replace(/(PhoneProductId\s*=\s*")([^\"]*)(\")/i, `$1${newGuid}$3`);
							} else {
								modified = modified.replace(phoneIdentityRegex, `<mp:PhoneIdentity$1 PhoneProductId="${newGuid}" />`);
							}
						}
					}
				}

				if (phonePublisherIdArg) {
					if (/(PhonePublisherId\s*=\s*")[^"]*(")/i.test(modified)) {
						modified = modified.replace(/(PhonePublisherId\s*=\s*")([^\"]*)(\")/i, `$1${phonePublisherIdArg}$3`);
					} else {
						modified = modified.replace(phoneIdentityRegex, `<mp:PhoneIdentity$1 PhonePublisherId="${phonePublisherIdArg}" />`);
					}
				}
			} else {
				// No PhoneIdentity tag - insert one only if we have values or auto-generation allowed
				if (noAutoGuid && !phoneProductIdArg && !phonePublisherIdArg && !allowZeroGuid) {
					// write original manifest unchanged
					fs.writeFileSync(destManifest, manifestContent, "utf8");
					this.interpolateConfigurationFile(projectData);
					return;
				}
				const appIdentifier = projectData && projectData.projectIdentifiers && projectData.projectIdentifiers["windows"] ? projectData.projectIdentifiers["windows"] : projectData.projectId;
				const chosenProd = phoneProductIdArg || (allowZeroGuid ? zeroGuid : (noAutoGuid ? null : (appIdentifier ? generateDeterministicGuidFromString(appIdentifier) : generateGuid())));
				const chosenPub = phonePublisherIdArg || "00000000-0000-0000-0000-000000000000";
				if (chosenProd) {
					if (allowZeroGuid && !phoneProductIdArg && this.$logger && typeof (this.$logger.warn) === "function") {
						this.$logger.warn("Using zero PhoneProductId because --allow-zero-guid was provided.");
					}
					const identityTag = `  <mp:PhoneIdentity PhoneProductId="${chosenProd}" PhonePublisherId="${chosenPub}" />\n\n`;
					modified = manifestContent.replace(/<\/Package>/i, `${identityTag}</Package>`);
				} else if (phonePublisherIdArg) {
					const identityTag = `  <mp:PhoneIdentity PhonePublisherId="${phonePublisherIdArg}" />\n\n`;
					modified = manifestContent.replace(/<\/Package>/i, `${identityTag}</Package>`);
				} else {
					fs.writeFileSync(destManifest, manifestContent, "utf8");
					this.interpolateConfigurationFile(projectData);
					return;
				}
			}

			// Ensure the manifest Identity element has required attributes
			try {
				const identityRegex = /<Identity\b([^>]*)\/>/i;
				const idMatch = modified.match(identityRegex);
				if (idMatch) {
					const attrs = idMatch[1] || "";
					let newAttrs = attrs;
					if (!/Name\s*=\s*\"/i.test(attrs)) {
						newAttrs = ` Name="${projectData.projectId}"` + newAttrs;
					}
					if (!/Publisher\s*=\s*\"/i.test(attrs)) {
						const publisherVal = phonePublisherIdArg && typeof phonePublisherIdArg === "string" ? phonePublisherIdArg : "CN=ui";
						newAttrs = newAttrs + ` Publisher="${publisherVal}"`;
					}
					modified = modified.replace(identityRegex, `<Identity${newAttrs} />`);
				}
			}
			catch (e) {
				// ignore and continue
			}

			// Ensure the Properties element contains DisplayName and PublisherDisplayName
			try {
				const propsRegex = /<Properties\b[^>]*>([\s\S]*?)<\/Properties>/i;
				const propsMatch = modified.match(propsRegex);
				if (propsMatch) {
					let inner = propsMatch[1];
					if (!/\<DisplayName\b/i.test(inner)) {
						inner = `\n    <DisplayName>${projectData.projectName}<\/DisplayName>` + inner;
					}
					if (!/\<PublisherDisplayName\b/i.test(inner)) {
						inner = `\n    <PublisherDisplayName>${projectData.projectName}<\/PublisherDisplayName>` + inner;
					}
					modified = modified.replace(propsRegex, `<Properties>${inner}\n  <\/Properties>`);
				}
				else {
					const propsTag = `  <Properties>\n    <DisplayName>${projectData.projectName}<\/DisplayName>\n    <PublisherDisplayName>${projectData.projectName}<\/PublisherDisplayName>\n    <Logo>Assets\\StoreLogo.png<\/Logo>\n  <\/Properties>\n\n`;
					if (/\<Dependencies\s*\>/i.test(modified)) {
						modified = modified.replace(/\<Dependencies\s*\>/i, `${propsTag}<Dependencies>`);
					}
					else {
						modified = modified.replace(/<\/Identity>/i, `</Identity>\n\n${propsTag}`);
					}
				}
			}
			catch (e) {
				// ignore
			}

			// Ensure the Application element has required Id, Executable and EntryPoint
			try {
				const appRegex = /<Application\b([^>]*)>/i;
				const appMatch = modified.match(appRegex);
				if (appMatch) {
					const attrs = appMatch[1] || "";
					let newAttrs = attrs;
					if (!/\bId\s*=\s*\"/i.test(attrs)) {
						newAttrs = ` Id=\"App\"` + newAttrs;
					}
					if (!/\bExecutable\s*=\s*\"/i.test(attrs)) {
						newAttrs = newAttrs + ` Executable=\"$targetnametoken$.exe\"`;
					}
					if (!/\bEntryPoint\s*=\s*\"/i.test(attrs)) {
						newAttrs = newAttrs + ` EntryPoint=\"${projectData.projectName}.App\"`;
					}
					modified = modified.replace(appRegex, `<Application${newAttrs}>`);
				}
			}
			catch (e) {
				// ignore
			}

			// Ensure the uap:VisualElements element has a DisplayName attribute
			try {
				const visRegex = /<uap:VisualElements\b([^>]*)>/i;
				const visMatch = modified.match(visRegex);
				if (visMatch) {
					const visAttrs = visMatch[1] || "";
					if (!/\bDisplayName\s*=\s*\"/i.test(visAttrs)) {
						const newVisAttrs = ` DisplayName=\"${projectData.projectName}\"` + visAttrs;
						modified = modified.replace(visRegex, `<uap:VisualElements${newVisAttrs}>`);
					}
				}
			}
			catch (e) {
				// ignore
			}

			fs.writeFileSync(destManifest, modified, "utf8");
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
