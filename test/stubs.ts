/* tslint:disable:no-empty */

import * as util from "util";
import * as chai from "chai";
import { EventEmitter } from "events";

export class LoggerStub implements ILogger {
	setLevel(level: string): void { }
	getLevel(): string { return undefined; }
	fatal(...args: string[]): void { }
	error(...args: string[]): void { }
	warn(...args: string[]): void { }
	warnWithLabel(...args: string[]): void { }
	info(...args: string[]): void { }
	debug(...args: string[]): void { }
	trace(...args: string[]): void { }

	public output = "";

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
	constructor() {
		new (require("../lib/common/errors").Errors)(); // we need the side effect of require'ing errors
	}

	fail(formatStr: string, ...args: any[]): void;
	fail(opts: { formatStr?: string; errorCode?: number; suppressCommandHelp?: boolean }, ...args: any[]): void;

	fail(...args: any[]) {
		throw args;
	}

	failWithoutHelp(message: string, ...args: any[]): void {
		throw new Error(message);
	}

	async beginCommand(action: () => Promise<boolean>, printHelpCommand: () => Promise<boolean>): Promise<boolean> {
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
	async install(packageName: string, pathToSave?: string, version?: string): Promise<string> {
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
		return "";
	}
	projectFilePath: string;
	projectId: string;
	dependencies: any;
	appDirectoryPath: string;
	appResourcesDirectoryPath: string;
	devDependencies: IStringDictionary;
	projectType: string;
	initializeProjectData(projectDir?: string): void {
		this.projectDir = this.projectDir || projectDir;
	}
}

export class PlatformsDataStub extends EventEmitter implements IPlatformsData {
	public platformsNames: string[];

	public getPlatformData(platform: string, projectData: IProjectData): IPlatformData {
		return {
			frameworkPackageName: "",
			platformProjectService: new PlatformProjectServiceStub(),
			emulatorServices: undefined,
			projectRoot: "",
			normalizedPlatformName: "",
			appDestinationDirectoryPath: "",
			deviceBuildOutputPath: "",
			getValidPackageNames: (buildOptions: { isForDevice?: boolean, isReleaseBuild?: boolean }) => [],
			frameworkFilesExtensions: [],
			relativeToFrameworkConfigurationFilePath: "",
			fastLivesyncFileExtensions: []
		};
	}

	public get availablePlatforms(): any {
		return undefined;
	}
}

export class PlatformProjectServiceStub extends EventEmitter implements IPlatformProjectService {
	getPlatformData(projectData: IProjectData): IPlatformData {
		return {
			frameworkPackageName: "",
			normalizedPlatformName: "",
			platformProjectService: this,
			emulatorServices: undefined,
			projectRoot: "",
			deviceBuildOutputPath: "",
			getValidPackageNames: (buildOptions: { isForDevice?: boolean, isReleaseBuild?: boolean }) => [],
			frameworkFilesExtensions: [],
			appDestinationDirectoryPath: "",
			relativeToFrameworkConfigurationFilePath: "",
			fastLivesyncFileExtensions: []
		};
	}
	getAppResourcesDestinationDirectoryPath(): string {
		return "";
	}
	validateOptions(): Promise<boolean> {
		return Promise.resolve(true);
	}
	validate(): Promise<void> {
		return Promise.resolve();
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
	checkForChanges(changesInfo: IProjectChangesInfo, options: IProjectChangesOptions, projectData: IProjectData): void {
		// Nothing yet.
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
	async prepareTemplate(templateName: string): Promise<string> {
		return Promise.resolve("");
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
		let result = this.passwords[prompt];
		delete this.passwords[prompt];
		return result;
	}
	async getString(prompt: string, options?: IPrompterOptions): Promise<string> {
		chai.assert.ok(prompt in this.strings, `PrompterStub didn't expect to be asked for: ${prompt}`);
		let result = this.strings[prompt];
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
		for (let key in this.strings) {
			throw unexpected(`PrompterStub was instructed to reply with "${this.strings[key]}" to a "${key}" question, but was never asked!`);
		}
		for (let key in this.passwords) {
			throw unexpected(`PrompterStub was instructed to reply with "${this.passwords[key]}" to a "${key}" password request, but was never asked!`);
		}
	}
}

function unreachable(): Error {
	return unexpected("Test case should not reach this point.");
}

function unexpected(msg: string): Error {
	let err = new chai.AssertionError(msg);
	err.showDiff = false;
	return err;
}

export class DebugServiceStub extends EventEmitter implements IPlatformDebugService {
	public async debug(): Promise<string[]> {
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
}

export class AndroidToolsInfoStub implements IAndroidToolsInfo {
	public getToolsInfo(): IAndroidToolsInfoData {
		let infoData: IAndroidToolsInfoData = Object.create(null);
		infoData.androidHomeEnvVar = "";
		infoData.compileSdkVersion = 23;
		infoData.buildToolsVersion = "23";
		infoData.targetSdkVersion = 23;
		infoData.supportRepositoryVersion = "23";
		return infoData;
	}

	public validateInfo(options?: { showWarningsAsErrors: boolean, validateTargetSdk: boolean }): boolean {
		return true;
	}

	public async validateJavacVersion(installedJavaVersion: string, options?: { showWarningsAsErrors: boolean }): Promise<boolean> {
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
}

export class ChildProcessStub {
	public spawnCount = 0;
	public spawnFromEventCount = 0;
	public lastCommand = "";
	public lastCommandArgs: string[] = [];

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
	public checkForChanges(platform: string): IProjectChangesInfo {
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
}

export class CommandsService implements ICommandsService {
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

	public async removePlatforms(platforms: string[]): Promise<void> {

	}

	public updatePlatforms(platforms: string[]): Promise<void> {
		return Promise.resolve();
	}

	public preparePlatform(platform: string, appFilesUpdaterOptions: IAppFilesUpdaterOptions, platformTemplate: string): Promise<boolean> {
		return Promise.resolve(true);
	}

	public shouldBuild(platform: string, projectData: IProjectData, buildConfig?: IBuildConfig): Promise<boolean> {
		return Promise.resolve(true);
	}

	public buildPlatform(platform: string, buildConfig?: IBuildConfig): Promise<void> {
		return Promise.resolve();
	}

	public async shouldInstall(device: Mobile.IDevice): Promise<boolean> {
		return true;
	}

	public installApplication(device: Mobile.IDevice, options: IRelease): Promise<void> {
		return Promise.resolve();
	}

	public deployPlatform(platform: string, appFilesUpdaterOptions: IAppFilesUpdaterOptions, deployOptions: IDeployPlatformOptions): Promise<void> {
		return Promise.resolve();
	}

	public startApplication(platform: string, runOptions: IRunPlatformOptions): Promise<void> {
		return Promise.resolve();
	}

	public cleanDestinationApp(platform: string, appFilesUpdaterOptions: IAppFilesUpdaterOptions, platformTemplate: string): Promise<void> {
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
}

export class EmulatorPlatformService implements IEmulatorPlatformService {
	public listAvailableEmulators(platform: string): Promise<void> {
		return Promise.resolve();
	}

	public getEmulatorInfo(platform: string, nameOfId: string): Promise<IEmulatorInfo> {
		return Promise.resolve(null);
	}

	public getiOSEmulators(): Promise<IEmulatorInfo[]> {
		return Promise.resolve(null);
	}

	public getAndroidEmulators(): IEmulatorInfo[] {
		return null;
	}

	public startEmulator(info: IEmulatorInfo): Promise<void> {
		return Promise.resolve();
	}
}
