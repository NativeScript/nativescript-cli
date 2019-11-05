import { EOL } from "os";
import * as path from "path";
import * as helpers from "../common/helpers";
import { TrackActionNames, NODE_MODULES_FOLDER_NAME, TNS_CORE_MODULES_NAME } from "../constants";
import { doctor, constants } from "nativescript-doctor";

export class DoctorService implements IDoctorService {
	private static DarwinSetupScriptLocation = path.join(__dirname, "..", "..", "setup", "mac-startup-shell-script.sh");
	private static WindowsSetupScriptExecutable = "powershell.exe";
	private static WindowsSetupScriptArguments = ["start-process", "-FilePath", "PowerShell.exe", "-NoNewWindow", "-Wait", "-ArgumentList", '"-NoProfile -ExecutionPolicy Bypass -Command iex ((new-object net.webclient).DownloadString(\'https://www.nativescript.org/setup/win\'))"'];

	private get $jsonFileSettingsService(): IJsonFileSettingsService {
		const jsonFileSettingsPath = path.join(this.$settingsService.getProfileDir(), "doctor-cache.json");
		return this.$injector.resolve<IJsonFileSettingsService>("jsonFileSettingsService", { jsonFileSettingsPath });
	}

	constructor(private $analyticsService: IAnalyticsService,
		private $hostInfo: IHostInfo,
		private $logger: ILogger,
		private $childProcess: IChildProcess,
		private $injector: IInjector,
		private $projectDataService: IProjectDataService,
		private $fs: IFileSystem,
		private $terminalSpinnerService: ITerminalSpinnerService,
		private $versionsService: IVersionsService,
		private $settingsService: ISettingsService) { }

	public async printWarnings(configOptions?: { trackResult: boolean, projectDir?: string, runtimeVersion?: string, options?: IOptions }): Promise<void> {
		const getInfosData: any = { projectDir: configOptions && configOptions.projectDir, androidRuntimeVersion: configOptions && configOptions.runtimeVersion };
		const infos = await this.$terminalSpinnerService.execute<NativeScriptDoctor.IInfo[]>({
			text: `Getting environment information ${EOL}`
		}, () => this.getInfos(getInfosData));

		const warnings = infos.filter(info => info.type === constants.WARNING_TYPE_NAME);
		const hasWarnings = warnings.length > 0;

		const hasAndroidWarnings = warnings.filter(warning => _.includes(warning.platforms, constants.ANDROID_PLATFORM_NAME)).length > 0;
		if (hasAndroidWarnings) {
			this.printPackageManagerTip();
		}

		if (!configOptions || configOptions.trackResult) {
			// TODO(Analytics): Consider sending this information to Google Analytics
			// await this.$analyticsService.track("DoctorEnvironmentSetup", hasWarnings ? "incorrect" : "correct");
		}

		if (hasWarnings) {
			this.$logger.info("There seem to be issues with your configuration.");
		} else {
			this.$logger.info("No issues were detected.".bold);
			await this.$jsonFileSettingsService.saveSetting(this.getKeyForConfiguration(getInfosData), infos);
			this.printInfosCore(infos);
		}

		try {
			await this.$versionsService.printVersionsInformation();
		} catch (err) {
			this.$logger.error("Cannot get the latest versions information from npm. Please try again later.");
		}

		this.checkForDeprecatedShortImportsInAppDir(configOptions.projectDir);

		await this.$injector.resolve<IPlatformEnvironmentRequirements>("platformEnvironmentRequirements").checkEnvironmentRequirements({
			platform: null,
			projectDir: configOptions && configOptions.projectDir,
			runtimeVersion: configOptions && configOptions.runtimeVersion,
			options: configOptions && configOptions.options
		});
	}

	public async runSetupScript(): Promise<ISpawnResult> {
		await this.$analyticsService.trackEventActionInGoogleAnalytics({
			action: TrackActionNames.RunSetupScript,
			additionalData: "Starting",
		});

		if (this.$hostInfo.isLinux) {
			await this.$analyticsService.trackEventActionInGoogleAnalytics({
				action: TrackActionNames.RunSetupScript,
				additionalData: "Skipped as OS is Linux",
			});
			return;
		}

		this.$logger.info("Running the setup script to try and automatically configure your environment.");

		if (this.$hostInfo.isDarwin) {
			await this.runSetupScriptCore(DoctorService.DarwinSetupScriptLocation, []);
		}

		if (this.$hostInfo.isWindows) {
			await this.runSetupScriptCore(DoctorService.WindowsSetupScriptExecutable, DoctorService.WindowsSetupScriptArguments);
		}

		await this.$analyticsService.trackEventActionInGoogleAnalytics({
			action: TrackActionNames.RunSetupScript,
			additionalData: "Finished",
		});
	}

	public async canExecuteLocalBuild(platform?: string, projectDir?: string, runtimeVersion?: string): Promise<boolean> {
		await this.$analyticsService.trackEventActionInGoogleAnalytics({
			action: TrackActionNames.CheckLocalBuildSetup,
			additionalData: "Starting",
		});
		const sysInfoConfig: NativeScriptDoctor.ISysInfoConfig = { platform, projectDir, androidRuntimeVersion: runtimeVersion };
		const infos = await this.getInfos(sysInfoConfig);
		const warnings = this.filterInfosByType(infos, constants.WARNING_TYPE_NAME);
		const hasWarnings = warnings.length > 0;
		if (hasWarnings) {
			await this.$analyticsService.trackEventActionInGoogleAnalytics({
				action: TrackActionNames.CheckLocalBuildSetup,
				additionalData: `Warnings:${warnings.map(w => w.message).join("__")}`,
			});
			this.printInfosCore(infos);
		} else {
			infos.map(info => this.$logger.trace(info.message));
			await this.$jsonFileSettingsService.saveSetting(this.getKeyForConfiguration(sysInfoConfig), infos);
		}

		await this.$analyticsService.trackEventActionInGoogleAnalytics({
			action: TrackActionNames.CheckLocalBuildSetup,
			additionalData: `Finished: Is setup correct: ${!hasWarnings}`,
		});

		return !hasWarnings;
	}

	public checkForDeprecatedShortImportsInAppDir(projectDir: string): void {
		if (projectDir) {
			try {
				const files = this.$projectDataService.getAppExecutableFiles(projectDir);
				const shortImports = this.getDeprecatedShortImportsInFiles(files, projectDir);
				if (shortImports.length) {
					this.$logger.printMarkdown("Detected short imports in your application. Please note that `short imports are deprecated` since NativeScript 5.2.0. More information can be found in this blogpost https://www.nativescript.org/blog/say-goodbye-to-short-imports-in-nativescript");
					shortImports.forEach(shortImport => {
						this.$logger.printMarkdown(`In file \`${shortImport.file}\` line \`${shortImport.line}\` is short import. Add \`tns-core-modules/\` in front of the required/imported module.`);
					});
				}
			} catch (err) {
				this.$logger.trace(`Unable to validate if project has short imports. Error is`, err);
			}
		}
	}

	protected getDeprecatedShortImportsInFiles(files: string[], projectDir: string): { file: string, line: string }[] {
		const shortImportRegExp = this.getShortImportRegExp(projectDir);
		const shortImports: { file: string, line: string }[] = [];

		for (const file of files) {
			const fileContent = this.$fs.readText(file);
			const strippedComments = helpers.stripComments(fileContent);
			const linesToCheck = _.flatten(strippedComments
				.split(/\r?\n/)
				.map(line => line.split(";")));

			const linesWithRequireStatements = linesToCheck
				.filter(line => /\btns-core-modules\b/.exec(line) === null && (/\bimport\b/.exec(line) || /\brequire\b/.exec(line)));

			for (const line of linesWithRequireStatements) {
				const matches = line.match(shortImportRegExp);

				if (matches && matches.length) {
					shortImports.push({ file, line });
				}
			}
		}

		return shortImports;
	}

	private getShortImportRegExp(projectDir: string): RegExp {
		const pathToTnsCoreModules = path.join(projectDir, NODE_MODULES_FOLDER_NAME, TNS_CORE_MODULES_NAME);
		const coreModulesSubDirs = this.$fs.readDirectory(pathToTnsCoreModules)
			.filter(entry => this.$fs.getFsStats(path.join(pathToTnsCoreModules, entry)).isDirectory());

		const stringRegularExpressionsPerDir = coreModulesSubDirs.map(c => {
			// require("text");
			// require("text/smth");
			// require(   "text/smth");
			// require(   "text/smth"   );
			// import * as text from "text";
			// import { a } from "text";
			// import {a } from "text/abc"
			const subDirPart = `[\"\']${c}[\"\'/]`;
			return `(\\brequire\\s*?\\(\\s*?${subDirPart})|(\\bimport\\b.*?from\\s*?${subDirPart})`;
		});

		return new RegExp(stringRegularExpressionsPerDir.join("|"), "g");
	}

	private async runSetupScriptCore(executablePath: string, setupScriptArgs: string[]): Promise<ISpawnResult> {
		return this.$childProcess.spawnFromEvent(executablePath, setupScriptArgs, "close", { stdio: "inherit" });
	}

	private printPackageManagerTip() {
		if (this.$hostInfo.isWindows) {
			this.$logger.info("TIP: To avoid setting up the necessary environment variables, you can use the chocolatey package manager to install the Android SDK and its dependencies." + EOL);
		} else if (this.$hostInfo.isDarwin) {
			this.$logger.info("TIP: To avoid setting up the necessary environment variables, you can use the Homebrew package manager to install the Android SDK and its dependencies." + EOL);
		}
	}

	private printInfosCore(infos: NativeScriptDoctor.IInfo[]): void {
		if (!helpers.isInteractive()) {
			infos.map(info => {
				let message = info.message;
				if (info.type === constants.WARNING_TYPE_NAME) {
					message = `WARNING: ${info.message.yellow} ${EOL} ${info.additionalInformation} ${EOL}`;
				}
				this.$logger.info(message);
			});
		}

		infos.filter(info => info.type === constants.INFO_TYPE_NAME)
			.map(info => {
				const spinner = this.$terminalSpinnerService.createSpinner();
				spinner.text = info.message;
				spinner.succeed();
			});

		infos.filter(info => info.type === constants.WARNING_TYPE_NAME)
			.map(info => {
				const spinner = this.$terminalSpinnerService.createSpinner();
				spinner.text = `${info.message.yellow} ${EOL} ${info.additionalInformation} ${EOL}`;
				spinner.fail();
			});
	}

	private filterInfosByType(infos: NativeScriptDoctor.IInfo[], type: string): NativeScriptDoctor.IInfo[] {
		return infos.filter(info => info.type === type);
	}

	private getKeyForConfiguration(sysInfoConfig?: NativeScriptDoctor.ISysInfoConfig): string {
		const nativeScriptData = sysInfoConfig && sysInfoConfig.projectDir && JSON.stringify(this.$fs.readJson(path.join(sysInfoConfig.projectDir, "package.json")).nativescript);
		const delimiter = "__";
		const key = [
			JSON.stringify(sysInfoConfig),
			process.env.ANDROID_HOME,
			process.env.JAVA_HOME,
			process.env["CommonProgramFiles(x86)"],
			process.env["CommonProgramFiles"],
			process.env.PROCESSOR_ARCHITEW6432,
			process.env.ProgramFiles,
			process.env["ProgramFiles(x86)"],
			nativeScriptData
		]
			.filter(a => !!a)
			.join(delimiter);

		const data = helpers.getHash(key, { algorithm: "md5" });
		return data;
	}

	private async getInfos(sysInfoConfig?: NativeScriptDoctor.ISysInfoConfig): Promise<NativeScriptDoctor.IInfo[]> {
		const key = this.getKeyForConfiguration(sysInfoConfig);
		// check if we already have cache for the results here
		const infosFromCache = await this.$jsonFileSettingsService.getSettingValue<NativeScriptDoctor.IInfo[]>(key);
		const infos = infosFromCache || await doctor.getInfos(sysInfoConfig);

		return infos;
	}
}
$injector.register("doctorService", DoctorService);
