/* tslint:disable:no-empty */

import * as util from "util";
import { assert } from "chai";
import { EventEmitter } from "events";
import { join } from "path";
import * as constants from "./../lib/constants";
import { Yok } from "./../lib/common/yok";
import { HostInfo } from "./../lib/common/host-info";
import { DevicePlatformsConstants } from "./../lib/common/mobile/device-platforms-constants";
import { PrepareData } from "../lib/data/prepare-data";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import * as path from "path";
import {
	IPackageInstallationManager,
	INpmInstallOptions,
	INodePackageManager,
	INpmInstallResultInfo,
	INodePackageManagerInstallOptions,
	INpmPackageNameParts,
	INpmsResult,
	IAndroidToolsInfoData,
	IAndroidToolsInfo,
	IAndroidBundleValidatorHelper,
	IAndroidResourcesMigrationService,
	IPerformanceService,
} from "../lib/declarations";
import {
	INsConfig,
	IProjectConfigService,
	IProjectData,
	IBuildConfig,
	IValidatePlatformOutput,
	IProjectDataService,
	IAssetsStructure,
	IAssetGroup,
	IProjectTemplatesService,
	ITemplateData,
	IProjectConfigInformation,
	IProjectBackupService,
	IBackup,
	BundlerType,
} from "../lib/definitions/project";
import {
	IPlatformData,
	IBuildOutputOptions,
	IPlatformsDataService,
} from "../lib/definitions/platform";
import { IPluginData, IBasePluginData } from "../lib/definitions/plugins";
import {
	IDeviceDebugService,
	IDebugResultInfo,
} from "../lib/definitions/debug";
import { IDependencyData } from "../lib/declarations";
import { IBuildData } from "../lib/definitions/build";
import {
	IFileSystem,
	IFsStats,
	IDictionary,
	IErrors,
	IFailOptions,
	IStringDictionary,
	ISpawnResult,
	IProjectDir,
	IProjectHelper,
	IHooksService,
	IAllowEmpty,
	IPrompterOptions,
	ISpawnFromEventOptions,
	IAnalyticsService,
	IProxySettings,
	Server,
	IPrompterQuestion,
} from "../lib/common/declarations";
import {
	IAndroidPluginBuildService,
	IPluginBuildOptions,
} from "../lib/definitions/android-plugin-migrator";
import { IInjector } from "../lib/common/definitions/yok";
import {
	IAddedNativePlatform,
	IPrepareInfo,
	IProjectChangesInfo,
} from "../lib/definitions/project-changes";
import {
	IEventActionData,
	IGoogleAnalyticsData,
} from "../lib/common/definitions/google-analytics";
import * as _ from "lodash";
import { SupportedConfigValues } from "../lib/tools/config-manipulation/config-transformer";
import { AffixOptions, ITempService } from "../lib/definitions/temp-service";
import {
	ITerminalSpinner,
	ITerminalSpinnerOptions,
	ITerminalSpinnerService,
} from "../lib/definitions/terminal-spinner-service";

export class LoggerStub implements ILogger {
	initialize(opts?: ILoggerOptions): void {}

	initializeCliLogger(): void {}

	getLevel(): string {
		return undefined;
	}

	fatal(...args: string[]): void {}

	error(...args: string[]): void {}

	warn(...args: string[]): void {
		this.warnOutput += util.format.apply(null, args) + "\n";
	}

	info(...args: string[]): void {
		this.output += util.format.apply(null, args) + "\n";
	}

	debug(...args: string[]): void {}

	trace(...args: string[]): void {
		this.traceOutput += util.format.apply(null, args) + "\n";
	}

	public output = "";
	public traceOutput = "";
	public warnOutput = "";

	prepare(item: any): string {
		return "";
	}

	printMarkdown(message: string): void {}

	write(...args: any[]): void {}

	printInfoMessageOnSameLine(message: string): void {}

	async printMsgWithTimeout(message: string, timeout: number): Promise<void> {}

	printOnStderr(formatStr?: any, ...args: any[]): void {}

	isVerbose(): boolean {
		return false;
	}

	clearScreen(): void {}
}

export class FileSystemStub implements IFileSystem {
	public fsStatCache: IDictionary<IFsStats> = {};
	public deletedFiles: string[] = [];

	deleteDirectorySafe(directory: string): void {
		return this.deleteDirectory(directory);
	}

	async zipFiles(
		zipFile: string,
		files: string[],
		zipPathCallback: (path: string) => string,
	): Promise<void> {
		return undefined;
	}

	async unzip(zipFile: string, destination: string): Promise<void> {
		return undefined;
	}

	exists(path: string): boolean {
		return true;
	}

	deleteFile(path: string): void {
		this.deletedFiles.push(path);
		return undefined;
	}

	deleteDirectory(directory: string): void {
		this.deletedFiles.push(directory);
		return undefined;
	}

	getFileSize(path: string): number {
		return undefined;
	}

	getSize(path: string): number {
		return 0;
	}

	async futureFromEvent(eventEmitter: any, event: string): Promise<any> {
		return undefined;
	}

	createDirectory(path: string): void {
		return undefined;
	}

	readDirectory(path: string): string[] {
		return undefined;
	}

	readFile(filename: string): Buffer | string {
		return undefined;
	}

	readText(filename: string, encoding?: string): string {
		return undefined;
	}

	readJson(filename: string, encoding?: string): any {
		return {};
	}

	writeFile(filename: string, data: any, encoding?: string): void {
		return undefined;
	}

	appendFile(filename: string, data: any, encoding?: string): void {
		return undefined;
	}

	writeJson(
		filename: string,
		data: any,
		space?: string,
		encoding?: string,
	): void {
		return undefined;
	}

	copyFile(sourceFileName: string, destinationFileName: string): void {
		return undefined;
	}

	openFile(filename: string): void {}

	createReadStream(
		path: string,
		options?: {
			flags?: string;
			encoding?: string;
			fd?: number;
			mode?: number;
			bufferSize?: number;
		},
	): any {
		return undefined;
	}

	createWriteStream(
		path: string,
		options?: { flags?: string; encoding?: string; string?: string },
	): any {
		return undefined;
	}

	chmod(path: string, mode: any): any {
		return undefined;
	}

	getUniqueFileName(baseName: string): string {
		return undefined;
	}

	getFsStats(path: string): IFsStats {
		if (!this.fsStatCache[path]) {
			this.fsStatCache[path] = <any>{
				ctime: this.getIncrementalDate(),
			};
		}

		return this.fsStatCache[path];
	}

	private dateCounter = 0;

	private getIncrementalDate(): Date {
		const date = new Date();
		date.setDate(date.getDate() + this.dateCounter);
		this.dateCounter++;

		return date;
	}

	getLsStats(path: string): IFsStats {
		return undefined;
	}

	isEmptyDir(directoryPath: string): boolean {
		return true;
	}

	ensureDirectoryExists(directoryPath: string): void {
		return undefined;
	}

	rename(oldPath: string, newPath: string): void {
		return undefined;
	}

	symlink(sourcePath: string, destinationPath: string): void {}

	async setCurrentUserAsOwner(path: string, owner: string): Promise<void> {
		return undefined;
	}

	enumerateFilesInDirectorySync(
		directoryPath: string,
		filterCallback?: (file: string, stat: IFsStats) => boolean,
	): string[] {
		return [];
	}

	isRelativePath(path: string): boolean {
		return false;
	}

	async getFileShasum(fileName: string): Promise<string> {
		return undefined;
	}

	async readStdin(): Promise<string> {
		return undefined;
	}

	renameIfExists(oldPath: string, newPath: string): boolean {
		return undefined;
	}

	rm(options: string, ...files: string[]): void {
		// Mock
	}

	deleteEmptyParents(directory: string): void {}

	utimes(path: string, atime: Date, mtime: Date): void {}

	realpath(filePath: string): string {
		return null;
	}
}

export class ErrorsStub implements IErrors {
	fail(formatStr: string, ...args: any[]): never;
	fail(opts: IFailOptions, ...args: any[]): never;

	fail(...args: any[]): never {
		throw new Error(require("util").format.apply(null, args || []));
	}

	failWithoutHelp(opts: string | IFailOptions, ...args: any[]): never {
		return this.fail(<any>opts, args);
	}

	failWithHelp(opts: string | IFailOptions, ...args: any[]): never {
		return this.fail(<any>opts, args);
	}

	async beginCommand(
		action: () => Promise<boolean>,
		printHelpCommand: () => Promise<void>,
	): Promise<boolean> {
		throw new Error("not supported");
	}

	executeAction(action: Function): any {
		return action();
	}

	verifyHeap(message: string): void {}

	printCallStack: boolean = false;

	validateArgs(client: string, knownOpts: any, shorthands: any): any {
		return null;
	}

	validateYargsArguments(
		parsed: any,
		knownOpts: any,
		shorthands: any,
		clientName?: string,
	): void {}
}

export class PackageInstallationManagerStub
	implements IPackageInstallationManager
{
	clearInspectorCache(): void {
		return undefined;
	}

	async install(
		packageName: string,
		pathToSave?: string,
		options?: INpmInstallOptions,
	): Promise<string> {
		return Promise.resolve("");
	}

	async uninstall(
		packageName: string,
		pathToSave?: string,
		options?: INpmInstallOptions,
	): Promise<string> {
		return Promise.resolve("");
	}

	async getLatestVersion(packageName: string): Promise<string> {
		return Promise.resolve("");
	}

	async getNextVersion(packageName: string): Promise<string> {
		return Promise.resolve("");
	}

	async getLatestCompatibleVersion(packageName: string): Promise<string> {
		return Promise.resolve("");
	}

	async getLatestCompatibleVersionSafe(packageName: string): Promise<string> {
		return Promise.resolve("");
	}

	async getInspectorFromCache(
		name: string,
		projectDir: string,
	): Promise<string> {
		return Promise.resolve("");
	}

	async getMaxSatisfyingVersion(): Promise<string> {
		return "";
	}

	async getInstalledDependencyVersion(
		packageName: string,
		projectDir?: string,
	): Promise<string> {
		return Promise.resolve("");
	}

	async getMaxSatisfyingVersionSafe(
		packageName: string,
		versionIdentifier: string,
	): Promise<string> {
		return Promise.resolve(versionIdentifier);
	}
}

export class NodePackageManagerStub implements INodePackageManager {
	constructor() {}

	public async install(
		packageName: string,
		pathToSave: string,
		config: INodePackageManagerInstallOptions,
	): Promise<INpmInstallResultInfo> {
		return {
			name: packageName,
			version: "latest",
		};
	}

	public async uninstall(
		packageName: string,
		config?: any,
		path?: string,
	): Promise<string> {
		return "";
	}

	public async search(filter: string[], config: any): Promise<string> {
		return "";
	}

	public async view(packageName: string, config: Object): Promise<any> {
		return {};
	}

	public async isRegistered(packageName: string): Promise<boolean> {
		return true;
	}

	public async getPackageNameParts(
		fullPackageName: string,
	): Promise<INpmPackageNameParts> {
		return {
			name: fullPackageName,
			version: "",
		};
	}

	public async getPackageFullName(
		packageNameParts: INpmPackageNameParts,
	): Promise<string> {
		return packageNameParts.version
			? `${packageNameParts.name}@${packageNameParts.version}`
			: packageNameParts.name;
	}

	public async searchNpms(keyword: string): Promise<INpmsResult> {
		return null;
	}

	public async getRegistryPackageData(packageName: string): Promise<any> {
		return null;
	}

	public async getCachePath(): Promise<string> {
		return "";
	}
}

export class ProjectBackupServiceStub implements IProjectBackupService {
	public _backups: any[] = [];
	public _shouldFail: boolean = false;

	shouldFail(shouldFail: boolean) {
		this._shouldFail = shouldFail;
	}

	getBackup(name: string): IBackup {
		const backup = new ProjectBackupServiceStub.Backup();
		this._backups.push(backup);

		if (this._shouldFail) {
			const origCreate = backup.create;
			backup.create = () => {
				origCreate.call(backup);
				throw new Error("backup failed (intended for tests)");
			};
		}

		return backup;
	}
	backup(name: string, pathsToBackup: string[]): IBackup {
		return this.getBackup(name).create();
	}
	restore(name: string, pathsToRestore: string[]): IBackup {
		return this.getBackup(name).restore();
	}

	static Backup = class Backup implements IBackup {
		public _meta = {
			createCalled: false,
			restoreCalled: false,
			removeCalled: false,
			isUpToDateCalled: false,
			addPathCalled: false,
			addPathsCalled: false,
		};
		constructor(public pathsToBackup: string[] = []) {}
		create(): IBackup {
			this._meta.createCalled = true;

			return this;
		}
		restore(): IBackup {
			this._meta.restoreCalled = true;

			return this;
		}
		remove(): IBackup {
			this._meta.removeCalled = true;

			return this;
		}
		isUpToDate(): boolean {
			this._meta.isUpToDateCalled = true;

			return true;
		}
		addPath(path: string): IBackup {
			this._meta.addPathCalled = true;

			return this;
		}
		addPaths(paths: string[]): IBackup {
			this._meta.addPathsCalled = true;

			return this;
		}
	};
}

export class ProjectConfigServiceStub implements IProjectConfigService {
	static initWithConfig(config: any) {
		const projectConfigService = new ProjectConfigServiceStub();
		projectConfigService.config = config;

		return projectConfigService;
	}

	protected config: INsConfig;

	setForceUsingNewConfig(force: boolean): boolean {
		return false;
	}

	setForceUsingLegacyConfig(force: boolean): boolean {
		return false;
	}

	getValue(key: string, defaultValue?: any): any {
		return _.get(this.readConfig(), key, defaultValue);
	}

	setValue(key: string, value: SupportedConfigValues): any {
		return _.set(this.readConfig(), key, value);
	}

	readConfig(projectDir?: string): INsConfig {
		return this.config;
	}

	detectProjectConfigs(projectDir?: string): IProjectConfigInformation {
		return {
			hasTSConfig: true,
			hasJSConfig: false,
			hasNSConfig: false,
			usingNSConfig: false,
			TSConfigPath: "",
			JSConfigPath: "",
			NSConfigPath: "",
		};
	}

	getDefaultTSConfig(appId: string, appPath: string): string {
		return `import { NativeScriptConfig } from '@nativescript/core';

    export default {
      id: '${appId}',
      appPath: '${appPath}'
      appResourcesPath: 'App_Resources',
      android: {
        v8Flags: '--expose_gc',
        markingMode: 'none'
      }
    } as NativeScriptConfig;`;
	}

	writeDefaultConfig(appId: string, projectDir?: string): string | boolean {
		return true;
	}

	async writeLegacyNSConfigIfNeeded(
		projectDir: string,
		runtimePackage: IBasePluginData,
	): Promise<void> {}
}

export class ProjectDataStub implements IProjectData {
	ignoredDependencies?: string[];
	initialized?: boolean;
	packageJsonData: any;
	projectDir: string;
	projectName: string;
	webpackConfigPath: string;
	bundlerConfigPath: string;
	bundler: BundlerType;

	get platformsDir(): string {
		return (
			this.platformsDirCache ||
			(this.projectDir &&
				join(this.projectDir, constants.PLATFORMS_DIR_NAME)) ||
			""
		);
	}

	set platformsDir(value) {
		this.platformsDirCache = value;
	}

	projectFilePath: string;
	projectIdentifiers: Mobile.IProjectIdentifier = {
		android: "org.nativescirpt.myiOSApp",
		ios: "org.nativescript.myProjectApp",
	};
	projectId: string;
	dependencies: any;
	nsConfig: any;
	appDirectoryPath: string;
	devDependencies: IStringDictionary;
	projectType: string;
	appResourcesDirectoryPath: string;
	private platformsDirCache: string = "";
	public androidManifestPath: string;
	public infoPlistPath: string;
	public appGradlePath: string;
	public gradleFilesDirectoryPath: string;
	public buildXcconfigPath: string;
	public podfilePath: string;
	public isShared: boolean;

	public initializeProjectData(projectDir?: string): void {
		this.projectDir = this.projectDir || projectDir;
		this.projectIdentifiers = { android: "", ios: "" };
		this.projectId = "";
		this.projectName = "";
		this.nsConfig = {
			android: {},
		};
	}

	public initializeProjectDataFromContent(): void {
		return;
	}

	public getAppResourcesDirectoryPath(projectDir?: string): string {
		if (!projectDir) {
			projectDir = this.projectDir;
		}

		// always return app/App_Resources
		return join(
			projectDir,
			constants.APP_FOLDER_NAME,
			constants.APP_RESOURCES_FOLDER_NAME,
		);
	}

	public getAppResourcesRelativeDirectoryPath(): string {
		return "";
	}

	public getAppDirectoryPath(projectDir?: string): string {
		if (!projectDir) {
			projectDir = this.projectDir;
		}

		return join(projectDir, "app") || "";
	}

	public getAppDirectoryRelativePath(): string {
		return "app";
	}

	getBuildRelativeDirectoryPath(): string {
		return "platforms";
	}
}

export class AndroidPluginBuildServiceStub
	implements IAndroidPluginBuildService
{
	buildAar(options: IPluginBuildOptions): Promise<boolean> {
		return Promise.resolve(true);
	}

	migrateIncludeGradle(options: IPluginBuildOptions): boolean {
		return true;
	}
}

export class PlatformProjectServiceStub
	extends EventEmitter
	implements IPlatformProjectService
{
	constructor(private platform: string) {
		super();
	}

	getPlatformData(projectData: IProjectData): IPlatformData {
		return {
			frameworkPackageName: `tns-${this.platform.toLowerCase()}`,
			normalizedPlatformName:
				this.platform.toLowerCase() === "ios" ? "iOS" : "Android",
			platformNameLowerCase: this.platform.toLowerCase(),
			platformProjectService: this,
			projectRoot: "",
			getBuildOutputPath: (buildConfig: IBuildConfig) => "",
			getValidBuildOutputData: (buildOptions: IBuildOutputOptions) => ({
				packageNames: [],
			}),
			appDestinationDirectoryPath: "",
			relativeToFrameworkConfigurationFilePath: "",
			fastLivesyncFileExtensions: [],
		};
	}

	getAppResourcesDestinationDirectoryPath(): string {
		return "";
	}

	validateOptions(): Promise<boolean> {
		return Promise.resolve(true);
	}

	validate(): Promise<IValidatePlatformOutput> {
		return Promise.resolve(<IValidatePlatformOutput>{});
	}

	async createProject(
		projectRoot: string,
		frameworkDir: string,
	): Promise<void> {
		return Promise.resolve();
	}

	async interpolateData(): Promise<void> {
		return Promise.resolve();
	}

	interpolateConfigurationFile(): void {
		return;
	}

	afterCreateProject(projectRoot: string): void {
		return null;
	}

	prepareProject(): Promise<void> {
		return Promise.resolve();
	}

	async buildProject(projectRoot: string): Promise<void> {
		return Promise.resolve();
	}

	async buildForDeploy(projectRoot: string): Promise<void> {
		return Promise.resolve();
	}

	isPlatformPrepared(projectRoot: string): boolean {
		return false;
	}

	async updatePlatform(
		currentVersion: string,
		newVersion: string,
		canUpdate: boolean,
	): Promise<boolean> {
		return Promise.resolve(true);
	}

	prepareAppResources(projectData: IProjectData): void {}

	async preparePluginNativeCode(pluginData: IPluginData): Promise<void> {
		return Promise.resolve();
	}

	async removePluginNativeCode(pluginData: IPluginData): Promise<void> {}

	async handleNativeDependenciesChange(): Promise<void> {
		return Promise.resolve();
	}

	async beforePrepareAllPlugins(
		projectData: IProjectData,
		dependencies?: IDependencyData[],
	): Promise<IDependencyData[]> {
		return Promise.resolve(dependencies);
	}

	async cleanDeviceTempFolder(deviceIdentifier: string): Promise<void> {
		return Promise.resolve();
	}

	async processConfigurationFilesFromAppResources(): Promise<void> {
		return Promise.resolve();
	}

	ensureConfigurationFileInAppResources(): void {
		return null;
	}

	async stopServices(): Promise<ISpawnResult> {
		return Promise.resolve({ stderr: "", stdout: "", exitCode: 0 });
	}

	async cleanProject(projectRoot: string): Promise<void> {
		return Promise.resolve();
	}

	async checkForChanges(
		changesInfo: IProjectChangesInfo,
		options: any,
		projectData: IProjectData,
	): Promise<void> {
		// Nothing yet.
	}

	getFrameworkVersion(projectData: IProjectData): string {
		return "";
	}

	getPluginPlatformsFolderPath(
		pluginData: IPluginData,
		platform: string,
	): string {
		return "";
	}

	getDeploymentTarget(projectData: IProjectData): any {
		return;
	}
}

export class NativeProjectDataStub
	extends EventEmitter
	implements IPlatformsDataService
{
	public platformNames: string[];

	public getPlatformData(
		platform: string,
		projectData: IProjectData,
	): IPlatformData {
		return {
			frameworkPackageName: `tns-${platform.toLowerCase()}`,
			platformProjectService: new PlatformProjectServiceStub(platform),
			platformNameLowerCase: platform.toLowerCase(),
			projectRoot: "",
			normalizedPlatformName:
				platform.toLowerCase() === "ios" ? "iOS" : "Android",
			appDestinationDirectoryPath: "",
			getBuildOutputPath: () => "",
			getValidBuildOutputData: (buildOptions: IBuildOutputOptions) => ({
				packageNames: [],
			}),
			relativeToFrameworkConfigurationFilePath: "",
			fastLivesyncFileExtensions: [],
		};
	}

	public get availablePlatforms(): any {
		return undefined;
	}
}

export class ProjectDataServiceStub implements IProjectDataService {
	getNSValue(propertyName: string): any {
		return {};
	}

	setNSValue(key: string, value: any): void {}

	removeNSProperty(propertyName: string): void {}

	removeNSConfigProperty(projectDir: string, propertyName: string): void {}

	removeDependency(dependencyName: string): void {}

	getProjectData(projectDir: string): IProjectData {
		const projectData = new ProjectDataStub();
		projectData.initializeProjectData(projectDir);

		return projectData;
	}

	async getAssetsStructure(opts: IProjectDir): Promise<IAssetsStructure> {
		return null;
	}

	async getIOSAssetsStructure(opts: IProjectDir): Promise<IAssetGroup> {
		return null;
	}

	async getAndroidAssetsStructure(opts: IProjectDir): Promise<IAssetGroup> {
		return null;
	}

	getAppExecutableFiles(projectDir: string): string[] {
		return [];
	}

	getRuntimePackage(
		projectDir: string,
		platform: constants.SupportedPlatform,
	): IBasePluginData {
		return {
			name: `@nativescript/${platform}`,
			version: null,
		};
	}

	getNSValueFromContent(): any {}
}

export class ProjectHelperStub implements IProjectHelper {
	constructor(
		public projectHelperErrorMsg?: string,
		public customProjectDir?: string,
	) {}

	public get projectDir(): string {
		if (this.projectHelperErrorMsg) {
			throw new Error(this.projectHelperErrorMsg);
		}

		return this.customProjectDir || "";
	}

	generateDefaultAppId(appName: string, baseAppId: string): string {
		return "org.nativescript";
	}

	sanitizeName(appName: string): string {
		return "";
	}
}

export class ProjectTemplatesService implements IProjectTemplatesService {
	async prepareTemplate(templateName: string): Promise<ITemplateData> {
		return Promise.resolve(<any>{});
	}
}

export class HooksServiceStub implements IHooksService {
	async executeBeforeHooks(commandName: string): Promise<void> {
		return Promise.resolve();
	}

	async executeAfterHooks(commandName: string): Promise<void> {
		return Promise.resolve();
	}

	hookArgsName = "hookArgs";
}

export class PrompterStub implements IPrompter {
	private strings: IDictionary<string> = {};
	private passwords: IDictionary<string> = {};
	private answers: IDictionary<string> = {};
	private questionChoices: IDictionary<any[]> = {};
	private confirmQuestions: IDictionary<boolean> = {};

	expect(options?: {
		strings?: IDictionary<string>;
		passwords?: IDictionary<string>;
		answers?: IDictionary<string>;
		questionChoices?: IDictionary<any[]>;
		confirmQuestions?: IDictionary<boolean>;
	}) {
		if (options) {
			this.strings = options.strings || this.strings;
			this.passwords = options.passwords || this.passwords;
			this.answers = options.answers || this.answers;
			this.questionChoices = options.questionChoices || this.questionChoices;
			this.confirmQuestions = options.confirmQuestions || this.confirmQuestions;
		}
	}

	async get(schemas: IPrompterQuestion[]): Promise<any> {
		throw unreachable();
	}

	async getPassword(message: string, options?: IAllowEmpty): Promise<string> {
		assert.ok(
			message in this.passwords,
			`PrompterStub didn't expect to give password for: ${message}`,
		);
		const result = this.passwords[message];
		delete this.passwords[message];
		return result;
	}

	async getString(
		message: string,
		options?: IPrompterOptions,
	): Promise<string> {
		assert.ok(
			message in this.strings,
			`PrompterStub didn't expect to be asked for: ${message}`,
		);
		const result = this.strings[message];
		delete this.strings[message];
		return result;
	}

	async promptForChoice(
		promptMessage: string,
		choices: any[],
	): Promise<string> {
		throw unreachable();
	}

	async promptForDetailedChoice(
		question: string,
		choices: any[],
	): Promise<string> {
		assert.ok(
			question in this.answers,
			`PrompterStub didn't expect to be asked: ${question}`,
		);
		assert.deepStrictEqual(choices, this.questionChoices[question]);
		const result = this.answers[question];
		delete this.answers[question];
		return result;
	}

	async confirm(
		message: string,
		defaultAction?: () => boolean,
	): Promise<boolean> {
		assert.ok(
			message in this.confirmQuestions,
			`PrompterStub didn't expect to be asked for: ${message}`,
		);
		const result = this.confirmQuestions[message];
		delete this.confirmQuestions[message];
		return result;
	}

	dispose(): void {
		throw unreachable();
	}

	assert() {
		for (const key in this.strings) {
			throw unexpected(
				`PrompterStub was instructed to reply with "${this.strings[key]}" to a "${key}" question, but was never asked!`,
			);
		}
		for (const key in this.passwords) {
			throw unexpected(
				`PrompterStub was instructed to reply with "${this.passwords[key]}" to a "${key}" password request, but was never asked!`,
			);
		}
		for (const key in this.confirmQuestions) {
			throw unexpected(
				`PrompterStub was instructed to reply with "${this.confirmQuestions[key]}" to a "${key}" confirm question, but was never asked!`,
			);
		}
	}
}

function unreachable() {
	return unexpected("Test case should not reach this point.");
}

function unexpected(msg: string) {
	return new Error(msg);
}

export class DebugServiceStub
	extends EventEmitter
	implements IDeviceDebugService
{
	public async debug(): Promise<IDebugResultInfo> {
		return;
	}

	public async debugStop(): Promise<void> {
		return;
	}

	public platform: string;
}

export class LiveSyncServiceStub
	extends EventEmitter
	implements ILiveSyncService
{
	public async liveSync(
		deviceDescriptors: ILiveSyncDeviceDescriptor[],
		liveSyncData: ILiveSyncInfo,
	): Promise<void> {
		return;
	}

	public async stopLiveSync(projectDir: string): Promise<void> {
		return;
	}

	public getLiveSyncDeviceDescriptors(
		projectDir: string,
	): ILiveSyncDeviceDescriptor[] {
		return [];
	}
}

export class AndroidToolsInfoStub implements IAndroidToolsInfo {
	public getToolsInfo(): IAndroidToolsInfoData {
		const infoData: IAndroidToolsInfoData = Object.create(null);
		infoData.androidHomeEnvVar = "ANDROID_HOME";
		infoData.compileSdkVersion = 23;
		infoData.buildToolsVersion = "23";
		infoData.targetSdkVersion = 23;
		return infoData;
	}

	public validateInfo(options?: {
		showWarningsAsErrors: boolean;
		validateTargetSdk: boolean;
	}): boolean {
		return true;
	}

	public validateJavacVersion(
		installedJavaVersion: string,
		options?: { showWarningsAsErrors: boolean },
	): boolean {
		return true;
	}

	public async getPathToAndroidExecutable(options?: {
		showWarningsAsErrors: boolean;
	}): Promise<string> {
		return "";
	}

	public async getPathToAdbFromAndroidHome(): Promise<string> {
		return Promise.resolve("");
	}

	public validateAndroidHomeEnvVariable(options?: {
		showWarningsAsErrors: boolean;
	}): boolean {
		return false;
	}

	public validateTargetSdk(options?: {
		showWarningsAsErrors: boolean;
	}): boolean {
		return true;
	}
}

export class ChildProcessStub extends EventEmitter {
	public spawnCount = 0;
	public execCount = 0;
	public spawnFromEventCount = 0;
	public lastCommand = "";
	public lastCommandArgs: string[] = [];

	public async exec(
		command: string,
		options?: any,
		execOptions?: any,
	): Promise<any> {
		this.execCount++;
		this.lastCommand = command;
		this.lastCommandArgs = command ? command.split(" ") : [];
		return null;
	}

	public spawn(command: string, args?: string[], options?: any): any {
		this.spawnCount++;
		this.lastCommand = command;
		this.lastCommandArgs = args;
		return null;
	}

	public async spawnFromEvent(
		command: string,
		args: string[],
		event: string,
		options?: any,
		spawnFromEventOptions?: ISpawnFromEventOptions,
	): Promise<ISpawnResult> {
		this.spawnFromEventCount++;
		this.lastCommand = command;
		this.lastCommandArgs = args;
		return null;
	}
}

export class ProjectChangesService implements IProjectChangesService {
	public async checkForChanges(
		platformData: IPlatformData,
		projectData: IProjectData,
		prepareData: PrepareData,
	): Promise<IProjectChangesInfo> {
		return <IProjectChangesInfo>{};
	}

	public getPrepareInfo(platformData: IPlatformData): IPrepareInfo {
		return null;
	}

	public async savePrepareInfo(
		platformData: IPlatformData,
		projectData: IProjectData,
		prepareData: IPrepareData,
	): Promise<void> {}

	public getPrepareInfoFilePath(platformData: IPlatformData): string {
		return "";
	}

	public get currentChanges(): IProjectChangesInfo {
		return <IProjectChangesInfo>{};
	}

	public async setNativePlatformStatus(
		platformData: IPlatformData,
		projectData: IProjectData,
		addedPlatform: IAddedNativePlatform,
	): Promise<void> {
		return;
	}
}

export class CommandsService implements ICommandsService {
	public currentCommandData = { commandName: "test", commandArguments: [""] };

	public allCommands(opts: { includeDevCommands: boolean }): string[] {
		return [];
	}

	public tryExecuteCommand(
		commandName: string,
		commandArguments: string[],
	): Promise<void> {
		return Promise.resolve();
	}

	public executeCommandUnchecked(
		commandName: string,
		commandArguments: string[],
	): Promise<boolean> {
		return Promise.resolve(true);
	}

	public completeCommand(): Promise<boolean> {
		return Promise.resolve(true);
	}
}

export class AndroidResourcesMigrationServiceStub
	implements IAndroidResourcesMigrationService
{
	canMigrate(platformString: string): boolean {
		return true;
	}

	hasMigrated(appResourcesDir: string): boolean {
		return false;
	}

	migrate(appResourcesDir: string): Promise<void> {
		return Promise.resolve();
	}
}

export class AndroidBundleValidatorHelper
	implements IAndroidBundleValidatorHelper
{
	validateDeviceApiLevel(device: Mobile.IDevice, buildData: IBuildData): void {
		return;
	}

	validateNoAab() {
		return true;
	}

	validateRuntimeVersion() {
		return;
	}
}

export class PerformanceService implements IPerformanceService {
	now(): number {
		return 10;
	}
	processExecutionData() {}
}

export class PacoteServiceStub implements IPacoteService {
	public async manifest(
		packageName: string,
		options?: IPacoteManifestOptions,
	): Promise<any> {
		return "";
	}
	public async extractPackage(
		packageName: string,
		destinationDirectory: string,
		options?: IPacoteExtractOptions,
	): Promise<void> {}
}

class TerminalSpinnerStub {
	public text: string;
	public start(text?: string): ITerminalSpinner {
		return this as any;
	}
	public stop(): ITerminalSpinner {
		return this as any;
	}
	public succeed(text?: string): ITerminalSpinner {
		return this as any;
	}
	public fail(text?: string): ITerminalSpinner {
		return this as any;
	}
	public warn(text?: string): ITerminalSpinner {
		return this as any;
	}
	public info(text?: string): ITerminalSpinner {
		return this as any;
	}
	public clear(): ITerminalSpinner {
		return this as any;
	}
	public render(): ITerminalSpinner {
		return this as any;
	}
	public frame(): ITerminalSpinner {
		return this as any;
	}
}

export class TerminalSpinnerServiceStub implements ITerminalSpinnerService {
	public createSpinner(
		spinnerOptions?: ITerminalSpinnerOptions,
	): ITerminalSpinner {
		return new TerminalSpinnerStub() as any;
	}
	public async execute<T>(
		spinnerOptions: ITerminalSpinnerOptions,
		action: () => Promise<T>,
	): Promise<T> {
		return null;
	}
}

export class MarkingModeServiceStub implements IMarkingModeService {
	handleMarkingModeFullDeprecation(
		options: IMarkingModeFullDeprecationOptions,
	): Promise<void> {
		return;
	}
}

export class AnalyticsService implements IAnalyticsService {
	async checkConsent(): Promise<void> {
		return;
	}
	async trackFeature(featureName: string): Promise<void> {
		return;
	}
	async trackException(exception: any, message: string): Promise<void> {
		return;
	}
	async setStatus(settingName: string, enabled: boolean): Promise<void> {
		return;
	}
	async getStatusMessage(
		settingName: string,
		jsonFormat: boolean,
		readableSettingName: string,
	): Promise<string> {
		return "Fake message";
	}
	async isEnabled(settingName: string): Promise<boolean> {
		return false;
	}
	async track(featureName: string, featureValue: string): Promise<void> {
		return;
	}
	async trackEventActionInGoogleAnalytics(data: IEventActionData) {
		return Promise.resolve();
	}
	async trackInGoogleAnalytics(data: IGoogleAnalyticsData) {
		return Promise.resolve();
	}
	async trackAcceptFeatureUsage(settings: {
		acceptTrackFeatureUsage: boolean;
	}) {
		return Promise.resolve();
	}
	async finishTracking() {
		return Promise.resolve();
	}
	setShouldDispose() {}
}

export class InjectorStub extends Yok implements IInjector {
	constructor() {
		super();
		this.register("fs", FileSystemStub);
		this.register("hostInfo", HostInfo);
		this.register("androidToolsInfo", AndroidToolsInfoStub);
		this.register("logger", LoggerStub);
		this.register("errors", ErrorsStub);
		this.register("options", {
			hostProjectModuleName: "app",
		});
		this.register("config", {});
		this.register("staticConfig", {});
		this.register("hooksService", HooksServiceStub);
		this.register("projectDataService", ProjectDataServiceStub);
		this.register("devicePlatformsConstants", DevicePlatformsConstants);
		this.register(
			"androidResourcesMigrationService",
			AndroidResourcesMigrationServiceStub,
		);
		this.register("commandsService", CommandsService);
		this.register("projectChangesService", ProjectChangesService);
		this.register("childProcess", ChildProcessStub);
		this.register("liveSyncService", LiveSyncServiceStub);
		this.register("prompter", PrompterStub);
		this.register("platformsDataService", NativeProjectDataStub);
		this.register("androidPluginBuildService", AndroidPluginBuildServiceStub);
		this.register("projectData", ProjectDataStub);
		this.register("projectConfigService", ProjectConfigServiceStub);
		this.register("packageInstallationManager", PackageInstallationManagerStub);
		this.register("packageInstallationManager", PackageInstallationManagerStub);
		this.register("markingModeService", MarkingModeServiceStub);
		this.register("httpClient", {
			httpRequest: async (
				options: any,
				proxySettings?: IProxySettings,
			): Promise<Server.IResponse> => undefined,
		});
		this.register("pluginsService", {
			add: async (): Promise<void> => undefined,
			remove: async (): Promise<void> => undefined,
			ensureAllDependenciesAreInstalled: () => {
				return Promise.resolve();
			},
		});
		this.register("devicesService", {
			getDevice: (): Mobile.IDevice => undefined,
			getDeviceByIdentifier: (): Mobile.IDevice => undefined,
		});
		this.register("terminalSpinnerService", TerminalSpinnerServiceStub);
	}
}

export class TempServiceStub implements ITempService {
	public async mkdirSync(affixes: string): Promise<string> {
		const prefix = typeof affixes === "string" ? affixes : "tmp";
		return mkdtempSync(path.join(tmpdir(), `${prefix}-`));
	}

	public async path(options: string | AffixOptions): Promise<string> {
		const opts: AffixOptions =
			typeof options === "string" ? { prefix: options } : options || {};
		const dir = opts.dir || tmpdir();
		const prefix = opts.prefix || "tmp";
		const suffix = opts.suffix || "";
		const name = `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}${suffix}`;
		return path.join(dir, name);
	}
}
