/* tslint:disable:no-empty */

import * as util from "util";
import * as chai from "chai";
import { EventEmitter } from "events";
import * as path from "path";
import * as constants from "./../lib/constants";
import { Yok } from "./../lib/common/yok";
import { HostInfo } from "./../lib/common/host-info";
import { DevicePlatformsConstants } from "./../lib/common/mobile/device-platforms-constants";

export class LoggerStub implements ILogger {
	setLevel(level: string): void { }
	getLevel(): string { return undefined; }
	fatal(...args: string[]): void { }
	error(...args: string[]): void { }
	warn(...args: string[]): void { }
	warnWithLabel(...args: string[]): void { }
	info(...args: string[]): void { }
	debug(...args: string[]): void { }
	trace(...args: string[]): void {
		this.traceOutput += util.format.apply(null, args) + "\n";
	}

	public output = "";
	public traceOutput = "";

	out(...args: string[]): void {
		this.output += util.format.apply(null, args) + "\n";
	}

	write(...args: string[]): void { }

	prepare(item: any): string {
		return "";
	}

	printInfoMessageOnSameLine(message: string): void { }
	async printMsgWithTimeout(message: string, timeout: number): Promise<void> {
		return null;
	}

	printMarkdown(message: string): void { }
}

export class ProcessServiceStub implements IProcessService {
	public listenersCount: number;

	public attachToProcessExitSignals(context: any, callback: () => void): void {
		return undefined;
	}
}

export class FileSystemStub implements IFileSystem {
	async zipFiles(zipFile: string, files: string[], zipPathCallback: (path: string) => string): Promise<void> {
		return undefined;
	}

	async unzip(zipFile: string, destination: string): Promise<void> {
		return undefined;
	}

	exists(path: string): boolean {
		return true;
	}

	deleteFile(path: string): void {
		return undefined;
	}

	async deleteDirectory(directory: string): Promise<void> {
		return Promise.resolve();
	}

	getFileSize(path: string): number {
		return undefined;
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

	readFile(filename: string): NodeBuffer | string {
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

	writeJson(filename: string, data: any, space?: string, encoding?: string): void {
		return undefined;
	}

	copyFile(sourceFileName: string, destinationFileName: string): void {
		return undefined;
	}

	openFile(filename: string): void { }

	createReadStream(path: string, options?: { flags?: string; encoding?: string; fd?: number; mode?: number; bufferSize?: number }): any {
		return undefined;
	}

	createWriteStream(path: string, options?: { flags?: string; encoding?: string; string?: string }): any {
		return undefined;
	}

	chmod(path: string, mode: any): any {
		return undefined;
	}

	getUniqueFileName(baseName: string): string {
		return undefined;
	}

	getFsStats(path: string): IFsStats {
		return undefined;
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

	symlink(sourcePath: string, destinationPath: string): void { }

	async setCurrentUserAsOwner(path: string, owner: string): Promise<void> {
		return undefined;
	}

	enumerateFilesInDirectorySync(directoryPath: string, filterCallback?: (file: string, stat: IFsStats) => boolean): string[] {
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

	deleteEmptyParents(directory: string): void { }

	utimes(path: string, atime: Date, mtime: Date): void { }

	realpath(filePath: string): string {
		return null;
	}
}

export class ErrorsStub implements IErrors {
	fail(formatStr: string, ...args: any[]): never;
	fail(opts: { formatStr?: string; errorCode?: number; suppressCommandHelp?: boolean }, ...args: any[]): never;

	fail(...args: any[]): never {
		throw new Error(require("util").format.apply(null, args || []));
	}

	failWithoutHelp(message: string, ...args: any[]): never {
		throw new Error(message);
	}

	async beginCommand(action: () => Promise<boolean>, printHelpCommand: () => Promise<void>): Promise<boolean> {
		throw new Error("not supported");
	}

	executeAction(action: Function): any {
		return action();
	}

	verifyHeap(message: string): void { }

	printCallStack: boolean = false;

	validateArgs(client: string, knownOpts: any, shorthands: any): any { return null; }
	validateYargsArguments(parsed: any, knownOpts: any, shorthands: any, clientName?: string): void { }
}

export class NpmInstallationManagerStub implements INpmInstallationManager {
	async install(packageName: string, pathToSave?: string, options?: INpmInstallOptions): Promise<string> {
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

	async getInspectorFromCache(name: string, projectDir: string): Promise<string> {
		return Promise.resolve("");
	}
}

export class ProjectDataStub implements IProjectData {
	projectDir: string;
	projectName: string;
	get platformsDir(): string {
		return this.plafromsDir;
	}
	set platformsDir(value) {
		this.plafromsDir = value;
	}
	projectFilePath: string;
	projectIdentifiers: Mobile.IProjectIdentifier;
	projectId: string;
	dependencies: any;
	nsConfig: any;
	appDirectoryPath: string;
	devDependencies: IStringDictionary;
	projectType: string;
	appResourcesDirectoryPath: string;
	private plafromsDir: string = "";
	public androidManifestPath: string;
	public infoPlistPath: string;
	public appGradlePath: string;
	public gradleFilesDirectoryPath: string;
	public buildXcconfigPath: string;

	public initializeProjectData(projectDir?: string): void {
		this.projectDir = this.projectDir || projectDir;
		this.projectIdentifiers = { android: "", ios: ""};
		this.projectId = "";
	}
	public initializeProjectDataFromContent(): void {
		return;
	}
	public getAppResourcesDirectoryPath(projectDir?: string): string {
		if (!projectDir) {
			projectDir = this.projectDir;
		}

		// always return app/App_Resources
		return path.join(projectDir, constants.APP_FOLDER_NAME, constants.APP_RESOURCES_FOLDER_NAME);
	}
	public getAppResourcesRelativeDirectoryPath(): string {
		return "";
	}
	public getAppDirectoryPath(projectDir?: string): string {
		if (!projectDir) {
			projectDir = this.projectDir;
		}

		return path.join(projectDir, "app") || "";
	}
	public getAppDirectoryRelativePath(): string {
		return "";
	}
}

export class AndroidPluginBuildServiceStub implements IAndroidPluginBuildService {
	buildAar(options: IBuildOptions): Promise<boolean> {
		return Promise.resolve(true);
	}
	migrateIncludeGradle(options: IBuildOptions): boolean {
		return true;
	}
}

export class PlatformProjectServiceStub extends EventEmitter implements IPlatformProjectService {
	getPlatformData(projectData: IProjectData): IPlatformData {
		return {
			frameworkPackageName: "",
			normalizedPlatformName: "",
			platformProjectService: this,
			projectRoot: "",
			deviceBuildOutputPath: "",
			getValidBuildOutputData: (buildOptions: IBuildOutputOptions) => ({ packageNames: [] }),
			frameworkFilesExtensions: [],
			appDestinationDirectoryPath: "",
			relativeToFrameworkConfigurationFilePath: "",
			fastLivesyncFileExtensions: []
		};
	}
	prebuildNativePlugin(options: IBuildOptions): Promise<void> {
		return Promise.resolve();
	}

	checkIfPluginsNeedBuild(projectData: IProjectData): Promise<Array<any>> {
		return Promise.resolve([]);
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
	validatePlugins(projectData: IProjectData) {
		return Promise.resolve();
	}
	async createProject(projectRoot: string, frameworkDir: string): Promise<void> {
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
	canUpdatePlatform(installedModulePath: string): boolean {
		return false;
	}
	async updatePlatform(currentVersion: string, newVersion: string, canUpdate: boolean): Promise<boolean> {
		return Promise.resolve(true);
	}
	prepareAppResources(appResourcesDirectoryPath: string): void { }

	async preparePluginNativeCode(pluginData: IPluginData): Promise<void> {
		return Promise.resolve();
	}

	async removePluginNativeCode(pluginData: IPluginData): Promise<void> { }

	async afterPrepareAllPlugins(): Promise<void> {
		return Promise.resolve();
	}
	async beforePrepareAllPlugins(): Promise<void> {
		return Promise.resolve();
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
	async cleanProject(projectRoot: string, projectData: IProjectData): Promise<void> {
		return Promise.resolve();
	}
	async checkForChanges(changesInfo: IProjectChangesInfo, options: IProjectChangesOptions, projectData: IProjectData): Promise<void> {
		// Nothing yet.
	}
	getFrameworkVersion(projectData: IProjectData): string {
		return "";
	}
	getPluginPlatformsFolderPath(pluginData: IPluginData, platform: string): string {
		return "";
	}
}

export class PlatformsDataStub extends EventEmitter implements IPlatformsData {
	public platformsNames: string[];

	public getPlatformData(platform: string, projectData: IProjectData): IPlatformData {
		return {
			frameworkPackageName: "",
			platformProjectService: new PlatformProjectServiceStub(),
			projectRoot: "",
			normalizedPlatformName: "",
			appDestinationDirectoryPath: "",
			deviceBuildOutputPath: "",
			getValidBuildOutputData: (buildOptions: IBuildOutputOptions) => ({ packageNames: []}),
			frameworkFilesExtensions: [],
			relativeToFrameworkConfigurationFilePath: "",
			fastLivesyncFileExtensions: []
		};
	}

	public get availablePlatforms(): any {
		return undefined;
	}
}

export class ProjectDataService implements IProjectDataService {
	getNSValue(propertyName: string): any {
		return {};
	}

	setNSValue(key: string, value: any): void { }

	removeNSProperty(propertyName: string): void { }

	removeDependency(dependencyName: string): void { }

	getProjectData(projectDir: string): IProjectData { return null; }

	async getAssetsStructure(opts: IProjectDir): Promise<IAssetsStructure> {
		return null;
	}

	async getIOSAssetsStructure(opts: IProjectDir): Promise<IAssetGroup> {
		return null;
	}

	async getAndroidAssetsStructure(opts: IProjectDir): Promise<IAssetGroup> {
		return null;
	}
}

export class ProjectHelperStub implements IProjectHelper {
	get projectDir(): string {
		return "";
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

	getTemplateVersion(templateName: string): Promise<string> {
		return Promise.resolve(constants.TemplateVersions.v1);
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

export class LockFile {

	async check(): Promise<boolean> {
		return false;
	}

	async lock(): Promise<void> {
	}

	async unlock(): Promise<void> {
	}
}

export class PrompterStub implements IPrompter {
	private strings: IDictionary<string> = {};
	private passwords: IDictionary<string> = {};

	expect(options?: { strings: IDictionary<string>, passwords: IDictionary<string> }) {
		if (options) {
			this.strings = options.strings || this.strings;
			this.passwords = options.passwords || this.passwords;
		}
	}

	async get(schemas: IPromptSchema[]): Promise<any> {
		throw unreachable();
	}
	async getPassword(prompt: string, options?: IAllowEmpty): Promise<string> {
		chai.assert.ok(prompt in this.passwords, `PrompterStub didn't expect to give password for: ${prompt}`);
		const result = this.passwords[prompt];
		delete this.passwords[prompt];
		return result;
	}
	async getString(prompt: string, options?: IPrompterOptions): Promise<string> {
		chai.assert.ok(prompt in this.strings, `PrompterStub didn't expect to be asked for: ${prompt}`);
		const result = this.strings[prompt];
		delete this.strings[prompt];
		return result;
	}
	async promptForChoice(promptMessage: string, choices: any[]): Promise<string> {
		throw unreachable();
	}
	async confirm(prompt: string, defaultAction?: () => boolean): Promise<boolean> {
		throw unreachable();
	}
	dispose(): void {
		throw unreachable();
	}

	assert() {
		for (const key in this.strings) {
			throw unexpected(`PrompterStub was instructed to reply with "${this.strings[key]}" to a "${key}" question, but was never asked!`);
		}
		for (const key in this.passwords) {
			throw unexpected(`PrompterStub was instructed to reply with "${this.passwords[key]}" to a "${key}" password request, but was never asked!`);
		}
	}
}

function unreachable(): Error {
	return unexpected("Test case should not reach this point.");
}

function unexpected(msg: string): Error {
	const err = new chai.AssertionError(msg);
	err.showDiff = false;
	return err;
}

export class DebugServiceStub extends EventEmitter implements IPlatformDebugService {
	public async debug(): Promise<string> {
		return;
	}

	public async debugStart(): Promise<void> {
		return;
	}

	public async debugStop(): Promise<void> {
		return;
	}

	public platform: string;
}

export class LiveSyncServiceStub implements ILiveSyncService {
	public async liveSync(deviceDescriptors: ILiveSyncDeviceInfo[], liveSyncData: ILiveSyncInfo): Promise<void> {
		return;
	}

	public async stopLiveSync(projectDir: string): Promise<void> {
		return;
	}

	public getLiveSyncDeviceDescriptors(projectDir: string): ILiveSyncDeviceInfo[] {
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
		infoData.supportRepositoryVersion = "23";
		return infoData;
	}

	public validateInfo(options?: { showWarningsAsErrors: boolean, validateTargetSdk: boolean }): boolean {
		return true;
	}

	public validateJavacVersion(installedJavaVersion: string, options?: { showWarningsAsErrors: boolean }): boolean {
		return true;
	}

	public async getPathToAndroidExecutable(options?: { showWarningsAsErrors: boolean }): Promise<string> {
		return "";
	}

	public async getPathToAdbFromAndroidHome(): Promise<string> {
		return Promise.resolve("");
	}

	public validateAndroidHomeEnvVariable(options?: { showWarningsAsErrors: boolean }): boolean {
		return false;
	}

	public validateTargetSdk(options?: { showWarningsAsErrors: boolean }): boolean {
		return true;
	}
}

export class ChildProcessStub {
	public spawnCount = 0;
	public execCount = 0;
	public spawnFromEventCount = 0;
	public lastCommand = "";
	public lastCommandArgs: string[] = [];

	public async exec(command: string, options?: any, execOptions?: any): Promise<any> {
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

	public async spawnFromEvent(command: string, args: string[], event: string, options?: any, spawnFromEventOptions?: ISpawnFromEventOptions): Promise<ISpawnResult> {
		this.spawnFromEventCount++;
		this.lastCommand = command;
		this.lastCommandArgs = args;
		return null;
	}
}

export class ProjectChangesService implements IProjectChangesService {
	public async checkForChanges(checkForChangesOpts: ICheckForChangesOptions): Promise<IProjectChangesInfo> {
		return <IProjectChangesInfo>{};
	}

	public getPrepareInfo(platform: string): IPrepareInfo {
		return null;
	}

	public savePrepareInfo(platform: string): void {
	}

	public getPrepareInfoFilePath(platform: string): string {
		return "";
	}

	public get currentChanges(): IProjectChangesInfo {
		return <IProjectChangesInfo>{};
	}

	public setNativePlatformStatus(platform: string, projectData: IProjectData, nativePlatformStatus: IAddedNativePlatform): void {
		return;
	}
}

export class CommandsService implements ICommandsService {
	public currentCommandData = { commandName: "test", commandArguments: [""] };

	public allCommands(opts: { includeDevCommands: boolean }): string[] {
		return [];
	}

	public tryExecuteCommand(commandName: string, commandArguments: string[]): Promise<void> {
		return Promise.resolve();
	}
	public executeCommandUnchecked(commandName: string, commandArguments: string[]): Promise<boolean> {
		return Promise.resolve(true);
	}

	public completeCommand(): Promise<boolean> {
		return Promise.resolve(true);
	}
}

export class PlatformServiceStub extends EventEmitter implements IPlatformService {
	public shouldPrepare(): Promise<boolean> {
		return Promise.resolve(true);
	}

	public validateOptions(): Promise<boolean> {
		return Promise.resolve(true);
	}

	public cleanPlatforms(platforms: string[]): Promise<void> {
		return Promise.resolve();
	}

	public addPlatforms(platforms: string[]): Promise<void> {
		return Promise.resolve();
	}

	public getInstalledPlatforms(): string[] {
		return [];
	}

	public getAvailablePlatforms(): string[] {
		return [];
	}

	public getPreparedPlatforms(): string[] {
		return [];
	}

	public saveBuildInfoFile(platform: string, projectDir: string, buildInfoFileDirname: string): void {
		return;
	}

	public async removePlatforms(platforms: string[]): Promise<void> {

	}

	public updatePlatforms(platforms: string[]): Promise<void> {
		return Promise.resolve();
	}

	public preparePlatform(platformInfo: IPreparePlatformInfo): Promise<boolean> {
		return Promise.resolve(true);
	}

	public shouldBuild(platform: string, projectData: IProjectData, buildConfig?: IBuildConfig): Promise<boolean> {
		return Promise.resolve(true);
	}

	public buildPlatform(platform: string, buildConfig?: IBuildConfig): Promise<string> {
		return Promise.resolve("");
	}

	public async shouldInstall(device: Mobile.IDevice): Promise<boolean> {
		return true;
	}

	public installApplication(device: Mobile.IDevice, options: IRelease): Promise<void> {
		return Promise.resolve();
	}

	public deployPlatform(config: IDeployPlatformInfo): Promise<void> {
		return Promise.resolve();
	}

	public startApplication(platform: string, runOptions: IRunPlatformOptions): Promise<void> {
		return Promise.resolve();
	}

	public cleanDestinationApp(platformInfo: IPreparePlatformInfo): Promise<void> {
		return Promise.resolve();
	}

	public validatePlatformInstalled(platform: string): void {

	}

	public validatePlatform(platform: string): void {

	}

	isPlatformSupportedForOS(platform: string, projectData: IProjectData): boolean {
		return true;
	}

	public getLatestApplicationPackageForDevice(platformData: IPlatformData): IApplicationPackage {
		return null;
	}

	public getLatestApplicationPackageForEmulator(platformData: IPlatformData, buildConfig: IBuildConfig): IApplicationPackage {
		return null;
	}

	public copyLastOutput(platform: string, targetPath: string, buildConfig: IBuildConfig): void {
	}

	public lastOutputPath(platform: string, buildConfig: IBuildConfig): string {
		return "";
	}

	public readFile(device: Mobile.IDevice, deviceFilePath: string): Promise<string> {
		return Promise.resolve("");
	}

	public async trackProjectType(): Promise<void> {
		return null;
	}

	public async trackActionForPlatform(actionData: ITrackPlatformAction): Promise<void> {
		return null;
	}

	public getCurrentPlatformVersion(platform: string, projectData: IProjectData): string {
		return null;
	}
}

export class AndroidResourcesMigrationServiceStub implements IAndroidResourcesMigrationService {
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

export class InjectorStub extends Yok implements IInjector {
	constructor() {
		super();
		this.register("fs", FileSystemStub);
		this.register("hostInfo", HostInfo);
		this.register("androidToolsInfo", AndroidToolsInfoStub);
		this.register("logger", LoggerStub);
		this.register("errors", ErrorsStub);
		this.register("options", {});
		this.register("config", {});
		this.register("staticConfig", {});
		this.register("hooksService", HooksServiceStub);
		this.register('projectDataService', ProjectDataService);
		this.register('devicePlatformsConstants', DevicePlatformsConstants);
		this.register("androidResourcesMigrationService", AndroidResourcesMigrationServiceStub);
		this.register("platformService", PlatformServiceStub);
		this.register("commandsService", CommandsService);
		this.register("projectChangesService", ProjectChangesService);
		this.register('childProcess', ChildProcessStub);
		this.register("liveSyncService", LiveSyncServiceStub);
		this.register("prompter", PrompterStub);
		this.register('platformsData', PlatformsDataStub);
		this.register("androidPluginBuildService", AndroidPluginBuildServiceStub);
		this.register('projectData', ProjectDataStub);
		this.register('npmInstallationManager', NpmInstallationManagerStub);
	}
}
