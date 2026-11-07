import * as path from "path";
import * as fs from "fs";
import * as constants from "../constants";
import * as projectServiceBaseLib from "./platform-project-service-base";
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
import { IPluginData, IPluginsService } from "../definitions/plugins";
import {
	IFileSystem,
	IChildProcess,
	IRelease,
	ISpawnResult,
} from "../common/declarations";
import { injector } from "../common/yok";
import { INotConfiguredEnvOptions } from "../common/definitions/commands";
import { IProjectChangesInfo } from "../definitions/project-changes";
import {
	LinuxNativeCodeBuilder,
	LinuxNativeUnit,
	NATIVE_ENTRIES,
	hasNativeCode,
	nativeUnitName,
	writeTypingsIndex,
} from "./linux-native-code";

/** Rust's `std::env::consts::ARCH`, used in the metadata file name the runtime looks for. */
const RUNTIME_ARCH: Record<string, string> = {
	x64: "x86_64",
	arm64: "aarch64",
};

/**
 * Linux apps run on a prebuilt runtime (`@nativescript/linux`), so a build is
 * a staged folder: the runtime executable named after the project, its
 * metadata and the bundled `app/`. Release builds are also packed as .tar.gz.
 *
 * Runtime package layout (`<package>/framework`):
 *   __PROJECT_NAME__/            platform project template (bundles go to app/)
 *   runtime/<x64|arm64>/ns-linux the runtime executable
 *   runtime/<x64|arm64>/metadata-<x86_64|aarch64>.bin
 *   typings/                     generated .d.ts for the C APIs in the metadata
 *   tools/<x64|arm64>/           metadata generator for app / plugin native code
 *
 * Native code (see linux-native-code.ts) is built into `lib/` and `metadata/`
 * next to the executable.
 */
export class LinuxProjectService
	extends projectServiceBaseLib.PlatformProjectServiceBase
{
	private static PLATFORM_NAME = "linux";
	private _platformData: IPlatformData | null = null;

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
						LinuxProjectService.PLATFORM_NAME,
					);
			const runtimePackage = this.$projectDataService.getRuntimePackage(
				projectData.projectDir,
				constants.PlatformTypes.linux,
			);
			const appProject = path.join(projectRoot, projectData.projectName);
			this._platformData = {
				frameworkPackageName: runtimePackage.name,
				normalizedPlatformName: "Linux",
				platformNameLowerCase: "linux",
				appDestinationDirectoryPath: appProject,
				platformProjectService: <any>this,
				projectRoot,
				getBuildOutputPath: (options?: any): string =>
					path.join(appProject, options?.release ? "dist" : "bin"),
				getValidBuildOutputData: (options?: any): IValidBuildOutputData =>
					options?.release
						? {
								packageNames: [`${projectData.projectName}.tar.gz`],
								regexes: [/\.tar\.gz$/],
							}
						: { packageNames: [projectData.projectName] },
				configurationFileName: "",
				frameworkDirectoriesExtensions: [],
				frameworkDirectoriesNames: ["runtime", "typings"],
				targetedOS: ["linux"],
				relativeToFrameworkConfigurationFilePath: "",
				fastLivesyncFileExtensions: [
					".jpg",
					".jpeg",
					".png",
					".gif",
					".bmp",
					".svg",
				],
			};
		}
		return this._platformData as IPlatformData;
	}

	public async validateOptions(): Promise<boolean> {
		return true;
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

	public getAppResourcesDestinationDirectoryPath(
		projectData: IProjectData,
	): string {
		return path.join(this.appProject(projectData), "App_Resources");
	}

	public async createProject(
		frameworkDir: string,
		_frameworkVersion: string,
		projectData: IProjectData,
	): Promise<void> {
		const projectRoot = this.getPlatformData(projectData).projectRoot;
		this.$fs.ensureDirectoryExists(projectRoot);
		for (const entry of fs.readdirSync(frameworkDir)) {
			// build tools are used from the package, see toolsDir()
			if (entry === "tools") {
				continue;
			}
			const target =
				entry === "__PROJECT_NAME__" ? projectData.projectName : entry;
			fs.cpSync(
				path.join(frameworkDir, entry),
				path.join(projectRoot, target),
				{ recursive: true },
			);
		}
		this.$fs.ensureDirectoryExists(
			path.join(this.appProject(projectData), constants.APP_FOLDER_NAME),
		);
	}

	public async interpolateData(_projectData: IProjectData): Promise<void> {
		// nothing to interpolate: there is no native project
	}

	public interpolateConfigurationFile(_projectData: IProjectData): void {
		// no configuration file
	}

	public afterCreateProject(
		_projectRoot: string,
		_projectData: IProjectData,
	): void {
		// nothing to do
	}

	/** Stages the runtime, metadata and app into the output folder (and packs it for release). */
	public async buildProject(
		projectRoot: string,
		projectData: IProjectData,
		buildConfig: any,
	): Promise<void> {
		const release = !!buildConfig?.release;
		const arch = this.arch();
		const runtimeDir = path.join(projectRoot, "runtime", arch);
		const runtime = path.join(runtimeDir, "ns-linux");
		if (!this.$fs.exists(runtime)) {
			throw new Error(
				`The Linux runtime for ${arch} was not found at ${runtime}. Reinstall the platform with \`ns platform clean linux\`.`,
			);
		}

		const appProject = this.appProject(projectData);
		const name = projectData.projectName;
		const outputRoot = this.getPlatformData(projectData).getBuildOutputPath({
			release,
		});
		const stage = release ? path.join(outputRoot, name) : outputRoot;
		this.$fs.deleteDirectory(stage);
		this.$fs.ensureDirectoryExists(stage);

		const executable = path.join(stage, name);
		fs.copyFileSync(runtime, executable);
		fs.chmodSync(executable, 0o755);
		const native = new LinuxNativeCodeBuilder(this.$childProcess, this.$logger);
		for (const file of fs.readdirSync(runtimeDir)) {
			if (file.startsWith("metadata-") && file.endsWith(".bin")) {
				await native.filterMetadata(
					path.join(runtimeDir, file),
					path.join(stage, file),
					{
						toolsDir: this.toolsDir(projectData, arch),
						cacheDir: path.join(projectRoot, "build", "metadata"),
						whitelist: path.join(
							projectRoot,
							constants.MetadataFilteringConstants.WHITELIST_FILE_NAME,
						),
						blacklist: path.join(
							projectRoot,
							constants.MetadataFilteringConstants.BLACKLIST_FILE_NAME,
						),
					},
				);
			}
		}
		fs.cpSync(
			path.join(appProject, constants.APP_FOLDER_NAME),
			path.join(stage, constants.APP_FOLDER_NAME),
			{
				recursive: true,
			},
		);
		const resources = this.getAppResourcesDestinationDirectoryPath(projectData);
		if (this.$fs.exists(resources)) {
			// sources and prebuilt libraries are build inputs only
			const native = new Set(
				NATIVE_ENTRIES.map((e) => path.join(resources, "Linux", e)),
			);
			fs.cpSync(resources, path.join(stage, "App_Resources"), {
				recursive: true,
				filter: (src) => !native.has(src),
			});
		}

		await this.buildNativeCode(projectData, stage, release);

		this.stageDesktopEntry(stage, projectData, release);

		if (release) {
			const archive = path.join(outputRoot, `${name}.tar.gz`);
			await this.$childProcess.spawnFromEvent(
				"tar",
				["-czf", archive, "-C", outputRoot, name],
				"close",
				{},
				{
					throwError: true,
				},
			);
			this.$logger.info(`Linux package: ${archive}`);
		}
	}

	public async prepareProject<T>(
		projectData: IProjectData,
		_prepareData: T,
	): Promise<void> {
		// plugin native code is built from node_modules, drop copies older CLIs staged
		this.$fs.deleteDirectory(
			path.join(this.appProject(projectData), "plugins"),
		);
	}

	public async checkForChanges(
		_changesInfo: IProjectChangesInfo,
		_prepareData: any,
		_projectData: IProjectData,
	): Promise<void> {
		// no native project to check
	}

	/**
	 * Mirrors `App_Resources/Linux` into the platform project. A project without
	 * one gets the runtime package's defaults (icon, .desktop and metainfo templates).
	 */
	public prepareAppResources(projectData: IProjectData): void {
		const resourcesDir = projectData.appResourcesDirectoryPath;
		let source = ["Linux", "linux"]
			.map((d) => resourcesDir && path.join(resourcesDir, d))
			.find((d) => d && this.$fs.exists(d));
		const defaults = path.join(
			this.getPlatformData(projectData).projectRoot,
			"App_Resources",
			"Linux",
		);
		if (!source && resourcesDir && this.$fs.exists(defaults)) {
			source = path.join(resourcesDir, "Linux");
			fs.cpSync(defaults, source, { recursive: true });
			this.$logger.info(`Added the default Linux resources to ${source}`);
		}
		const destination = path.join(
			this.getAppResourcesDestinationDirectoryPath(projectData),
			"Linux",
		);
		this.$fs.deleteDirectory(destination);
		if (source) {
			fs.cpSync(source, destination, { recursive: true });
		}
	}

	public isPlatformPrepared(
		projectRoot: string,
		projectData: IProjectData,
	): boolean {
		return this.$fs.exists(path.join(projectRoot, projectData.projectName));
	}

	/** Plugin native code is compiled at build time, see nativeUnits(). */
	public async preparePluginNativeCode(
		_pluginData: IPluginData,
		_projectData: IProjectData,
	): Promise<void> {}

	public async removePluginNativeCode(
		_pluginData: IPluginData,
		_projectData: IProjectData,
	): Promise<void> {}

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
		// nothing to rebuild
	}

	public async cleanDeviceTempFolder(
		_deviceIdentifier: string,
		_projectData: IProjectData,
	): Promise<void> {
		// apps run in place
	}

	public async processConfigurationFilesFromAppResources(
		_projectData: IProjectData,
		_opts: { release: boolean },
	): Promise<void> {
		// no configuration files
	}

	public ensureConfigurationFileInAppResources(
		_projectData: IProjectData,
	): void {
		// no configuration file
	}

	public async stopServices(_projectRoot: string): Promise<ISpawnResult> {
		return { stderr: "", stdout: "", exitCode: 0 };
	}

	public async cleanProject(projectRoot: string): Promise<void> {
		this.$fs.deleteDirectory(path.join(projectRoot, constants.BUILD_DIR));
	}

	/**
	 * Desktop integration next to the executable: icons/hicolor/<size>/apps/<app-id>.png|svg,
	 * <app-id>.desktop and <app-id>.metainfo.xml from App_Resources/Linux
	 * (templates use __APP_ID__, __APP_NAME__ and __EXEC__). Release builds
	 * also get install.sh, which installs the app into ~/.local.
	 */
	private stageDesktopEntry(
		stage: string,
		projectData: IProjectData,
		release: boolean,
	): void {
		const resources = path.join(
			this.getAppResourcesDestinationDirectoryPath(projectData),
			"Linux",
		);
		const appId =
			projectData.projectIdentifiers?.linux || projectData.projectId;
		const name = projectData.projectName;
		const fill = (template: string, exec: string) =>
			template
				.split("__APP_ID__")
				.join(appId)
				.split("__APP_NAME__")
				.join(name)
				.split("__EXEC__")
				.join(exec);

		const icon = ["icon.svg", "icon.png"]
			.map((f) => path.join(resources, f))
			.find((f) => this.$fs.exists(f));
		if (icon) {
			// an icon theme layout, so GTK and the desktop find it by app id
			const size = path.extname(icon) === ".svg" ? "scalable" : "512x512";
			const icons = path.join(stage, "icons", "hicolor", size, "apps");
			this.$fs.ensureDirectoryExists(icons);
			fs.copyFileSync(icon, path.join(icons, appId + path.extname(icon)));
		}

		const desktopTemplate = path.join(resources, "app.desktop");
		const desktop = this.$fs.exists(desktopTemplate)
			? this.$fs.readText(desktopTemplate)
			: `[Desktop Entry]\nType=Application\nName=__APP_NAME__\nExec=__EXEC__\nIcon=__APP_ID__\nTerminal=false\nStartupWMClass=__APP_ID__\n`;
		// debug builds point at this folder, install.sh rewrites release entries
		fs.writeFileSync(
			path.join(stage, `${appId}.desktop`),
			fill(desktop, release ? "__EXEC__" : path.join(stage, name)),
		);

		const metainfo = path.join(resources, "app.metainfo.xml");
		if (this.$fs.exists(metainfo)) {
			fs.writeFileSync(
				path.join(stage, `${appId}.metainfo.xml`),
				fill(this.$fs.readText(metainfo), name),
			);
		}

		if (release) {
			const script = path.join(stage, "install.sh");
			fs.writeFileSync(
				script,
				[
					"#!/bin/sh",
					"# Installs the app for the current user (~/.local).",
					"set -e",
					'src="$(cd "$(dirname "$0")" && pwd)"',
					'data="${XDG_DATA_HOME:-$HOME/.local/share}"',
					`dest="$data/${appId}"`,
					'rm -rf "$dest" && mkdir -p "$dest" "$data/applications" "$data/icons"',
					'cp -r "$src/." "$dest/"',
					`sed "s|__EXEC__|$dest/${name}|g" "$src/${appId}.desktop" > "$data/applications/${appId}.desktop"`,
					'[ -d "$src/icons" ] && cp -r "$src/icons/." "$data/icons/"',
					`echo "Installed ${name} to $dest"`,
					"",
				].join("\n"),
			);
			fs.chmodSync(script, 0o755);
		}
	}

	/**
	 * Compiles app / plugin native code into `stage` (lib/, metadata/). Typings
	 * refresh `typings/linux` once `ns typings linux` created it.
	 */
	public async buildNativeCode(
		projectData: IProjectData,
		stage: string,
		release: boolean,
		typingsDir?: string,
	): Promise<void> {
		const arch = this.arch();
		const projectRoot = this.getPlatformData(projectData).projectRoot;
		const projectTypings = path.join(
			projectData.projectDir,
			"typings",
			"linux",
		);
		await new LinuxNativeCodeBuilder(this.$childProcess, this.$logger).build(
			await this.nativeUnits(projectData),
			{
				arch,
				release,
				stage,
				workDir: path.join(projectRoot, "build", "native"),
				generatorDir: this.toolsDir(projectData, arch),
				blacklist: path.join(
					projectRoot,
					constants.MetadataFilteringConstants.BLACKLIST_FILE_NAME,
				),
				typingsDir:
					typingsDir ??
					(this.$fs.exists(projectTypings)
						? projectTypings
						: path.join(projectRoot, "typings")),
			},
		);
		if (!typingsDir && this.$fs.exists(projectTypings)) {
			writeTypingsIndex(projectTypings);
		}
	}

	/** Typings of the SDK C APIs (`index.d.ts` references the GUI modules). */
	public sdkTypingsDir(projectData: IProjectData): string {
		return path.join(
			this.toolsDir(projectData, this.arch()),
			"..",
			"..",
			"typings",
		);
	}

	/** Build tools (metadata generator, filter) stay in the runtime package. */
	private toolsDir(projectData: IProjectData, arch: string): string {
		const runtimePackage = this.$projectDataService.getRuntimePackage(
			projectData.projectDir,
			constants.PlatformTypes.linux,
		);
		return path.join(
			projectData.projectDir,
			constants.NODE_MODULES_FOLDER_NAME,
			runtimePackage.name,
			"framework",
			"tools",
			arch,
		);
	}

	/** App_Resources/Linux and each plugin's platforms/linux with native code. */
	private async nativeUnits(
		projectData: IProjectData,
	): Promise<LinuxNativeUnit[]> {
		const units: LinuxNativeUnit[] = [];
		const resources = ["Linux", "linux"]
			.map((d) =>
				projectData.appResourcesDirectoryPath
					? path.join(projectData.appResourcesDirectoryPath, d)
					: null,
			)
			.find((d) => d && this.$fs.exists(d));
		if (resources && hasNativeCode(resources)) {
			units.push({ name: "app", dir: resources });
		}
		const pluginsService: IPluginsService = injector.resolve("pluginsService");
		for (const plugin of await pluginsService.getAllInstalledPlugins(
			projectData,
		)) {
			const dir = path.join(
				plugin.fullPath,
				constants.PLATFORMS_DIR_NAME,
				LinuxProjectService.PLATFORM_NAME,
			);
			if (hasNativeCode(dir)) {
				units.push({ name: nativeUnitName(plugin.name), dir });
			}
		}
		return units;
	}

	private appProject(projectData: IProjectData): string {
		return path.join(
			this.getPlatformData(projectData).projectRoot,
			projectData.projectName,
		);
	}

	private arch(): string {
		const arch = (this.$options as any).arch || process.arch;
		if (!RUNTIME_ARCH[arch]) {
			throw new Error(
				`Unsupported Linux architecture '${arch}', expected x64 or arm64.`,
			);
		}
		return arch;
	}
}

injector.register("linuxProjectService", LinuxProjectService);
