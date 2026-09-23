import * as path from "path";
import * as _ from "lodash";
import { TESTING_FRAMEWORKS, ProjectTypes } from "../constants";
import { fromWindowsRelativePathToUnix } from "../common/helpers";
import {
	IProjectData,
	ITestInitializationService,
} from "../definitions/project";
import { INodePackageManager, IOptions } from "../declarations";
import { IPluginsService } from "../definitions/plugins";
import { ICommand, ICommandParameter } from "../common/definitions/commands";
import {
	IDictionary,
	IErrors,
	IFileSystem,
	IResourceLoader,
	IDependencyInformation,
} from "../common/declarations";
import { injector } from "../common/yok";
import { color } from "../color";

class TestInitCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	private karmaConfigAdditionalFrameworks: IDictionary<string[]> = {
		mocha: ["chai"],
	};

	/**
	 * Android blocks cleartext traffic by default (API 28+), which would
	 * reject the runner's ws:// connection to the host. Scope the exception
	 * to the emulator loopback alias and adb-reverse loopback only.
	 */
	private ensureAndroidNetworkSecurityConfig(bufferedLogs: string[]): void {
		const manifestPath = path.join(
			this.$projectData.appResourcesDirectoryPath,
			"Android",
			"src",
			"main",
			"AndroidManifest.xml",
		);
		if (!this.$fs.exists(manifestPath)) {
			bufferedLogs.push(
				color.yellow(
					"Could not locate App_Resources/Android/src/main/AndroidManifest.xml. For Android test runs, allow cleartext traffic to 10.0.2.2 and 127.0.0.1 via a network security config.",
				),
			);
			return;
		}

		const manifestContent = this.$fs.readText(manifestPath);
		if (manifestContent.indexOf("networkSecurityConfig") !== -1) {
			bufferedLogs.push(
				color.yellow(
					"AndroidManifest.xml already sets android:networkSecurityConfig — make sure it permits cleartext traffic to 10.0.2.2 and 127.0.0.1 for test runs.",
				),
			);
			return;
		}

		const xmlDirectory = path.join(
			this.$projectData.appResourcesDirectoryPath,
			"Android",
			"src",
			"main",
			"res",
			"xml",
		);
		this.$fs.ensureDirectoryExists(xmlDirectory);
		const securityConfigPath = path.join(xmlDirectory, "network_security.xml");
		if (!this.$fs.exists(securityConfigPath)) {
			this.$fs.copyFile(
				this.$resources.resolvePath("test/network_security.xml"),
				securityConfigPath,
			);
			bufferedLogs.push(
				`Added ${color.yellow("App_Resources/Android/src/main/res/xml/network_security.xml")}`,
			);
		}

		this.$fs.writeFile(
			manifestPath,
			manifestContent.replace(
				/<application\b/,
				'<application android:networkSecurityConfig="@xml/network_security"',
			),
		);
		bufferedLogs.push(
			`Set ${color.yellow("android:networkSecurityConfig")} in AndroidManifest.xml`,
		);
	}

	constructor(
		private $packageManager: INodePackageManager,
		private $projectData: IProjectData,
		private $errors: IErrors,
		private $options: IOptions,
		private $prompter: IPrompter,
		private $fs: IFileSystem,
		private $resources: IResourceLoader,
		private $pluginsService: IPluginsService,
		private $logger: ILogger,
		private $testInitializationService: ITestInitializationService,
	) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		const projectDir = this.$projectData.projectDir;

		const frameworkToInstall =
			this.$options.framework ||
			(await this.$prompter.promptForChoice(
				"Select testing framework:",
				TESTING_FRAMEWORKS,
			));
		if (TESTING_FRAMEWORKS.indexOf(frameworkToInstall) === -1) {
			this.$errors.failWithHelp(
				`Unknown or unsupported unit testing framework: ${frameworkToInstall}.`,
			);
		}

		const projectFilesExtension =
			this.$projectData.projectType === ProjectTypes.TsFlavorName ||
			this.$projectData.projectType === ProjectTypes.NgFlavorName
				? ".ts"
				: ".js";

		let modulesToInstall: IDependencyInformation[] = [];
		try {
			modulesToInstall =
				this.$testInitializationService.getDependencies(frameworkToInstall);
		} catch (err) {
			this.$errors.fail(
				`Unable to install the unit testing dependencies. Error: '${err.message}'`,
			);
		}

		modulesToInstall = modulesToInstall.filter(
			(moduleToInstall) =>
				!moduleToInstall.projectType ||
				moduleToInstall.projectType === projectFilesExtension,
		);

		for (const mod of modulesToInstall) {
			let moduleToInstall = mod.name;
			moduleToInstall += `@${mod.version}`;
			await this.$packageManager.install(moduleToInstall, projectDir, {
				// Packages with native code must land in "dependencies" — the CLI
				// integrates plugin platform files (pods, aars) only from there.
				...(mod.saveInDependencies ? { save: true } : { "save-dev": true }),
				"save-exact": true,
				optional: false,
				disableNpmInstall: this.$options.disableNpmInstall,
				frameworkPath: this.$options.frameworkPath,
				ignoreScripts: this.$options.ignoreScripts,
				path: this.$options.path,
			});

			const modulePath = path.join(projectDir, "node_modules", mod.name);
			const modulePackageJsonPath = path.join(modulePath, "package.json");
			const modulePackageJsonContent = this.$fs.readJson(modulePackageJsonPath);
			const modulePeerDependencies =
				modulePackageJsonContent.peerDependencies || {};
			const modulePeerDependenciesMeta =
				modulePackageJsonContent.peerDependenciesMeta || {};
			const projectPackageJson = this.$fs.readJson(
				path.join(projectDir, "package.json"),
			);
			const installedProjectDependencies = {
				...projectPackageJson.dependencies,
				...projectPackageJson.devDependencies,
			};

			for (const peerDependency in modulePeerDependencies) {
				const isPeerDependencyExcluded = _.includes(
					mod.excludedPeerDependencies,
					peerDependency,
				);
				if (isPeerDependencyExcluded) {
					continue;
				}

				if (
					modulePeerDependenciesMeta[peerDependency] &&
					modulePeerDependenciesMeta[peerDependency].optional
				) {
					continue;
				}

				// Reinstalling an already-declared package would move it to
				// devDependencies — for packages with native code (e.g.
				// @nativescript/core) that strips their platform files from the
				// native build.
				if (installedProjectDependencies[peerDependency]) {
					continue;
				}

				const dependencyVersion = modulePeerDependencies[peerDependency] || "*";

				// catch errors when a peerDependency is already installed
				// e.g karma is installed; karma-jasmine depends on karma and will try to install it again
				try {
					await this.$packageManager.install(
						`${peerDependency}@${dependencyVersion}`,
						projectDir,
						{
							"save-dev": true,
							"save-exact": true,
							disableNpmInstall: false,
							frameworkPath: this.$options.frameworkPath,
							ignoreScripts: this.$options.ignoreScripts,
							path: this.$options.path,
						},
					);
				} catch (e) {
					this.$logger.error(e.message);
				}
			}
		}

		const isVitest = frameworkToInstall === "vitest";

		if (!isVitest) {
			// The Karma client only exists in the v4 line — v5+ is Vitest-only, so
			// an unpinned install would break these setups once v5 is `latest`.
			await this.$pluginsService.add(
				"@nativescript/unit-test-runner@^4.0.0",
				this.$projectData,
			);
		}

		this.$logger.clearScreen();

		const bufferedLogs = [];

		const testsDir = path.join(this.$projectData.appDirectoryPath, "tests");
		const projectTestsDir = path.relative(
			this.$projectData.projectDir,
			testsDir,
		);
		const relativeTestsDir = path.relative(
			this.$projectData.appDirectoryPath,
			testsDir,
		);
		let shouldCreateSampleTests = true;
		if (this.$fs.exists(testsDir)) {
			const specFilenamePattern = `<filename>.spec${projectFilesExtension}`;
			bufferedLogs.push(
				color.yellow(
					[
						`Note: The "${projectTestsDir}" directory already exists, will not create example tests in the project.`,
						`You may create "${specFilenamePattern}" files anywhere you'd like.`,
						"",
					].join("\n"),
				),
			);
			shouldCreateSampleTests = false;
		}

		this.$fs.ensureDirectoryExists(testsDir);

		if (isVitest) {
			const vitestConfigResourcePath = this.$resources.resolvePath(
				"test/vitest.config.mts",
			);
			this.$fs.copyFile(
				vitestConfigResourcePath,
				path.join(projectDir, "vitest.config.mts"),
			);
			bufferedLogs.push(`Added/replaced ${color.yellow("vitest.config.mts")}`);
			this.ensureAndroidNetworkSecurityConfig(bufferedLogs);
		} else {
			const frameworks = [frameworkToInstall]
				.concat(this.karmaConfigAdditionalFrameworks[frameworkToInstall] || [])
				.map((fw) => `'${fw}'`)
				.join(", ");
			const testFiles = `'${fromWindowsRelativePathToUnix(
				relativeTestsDir,
			)}/**/*${projectFilesExtension}'`;
			const karmaConfTemplate = this.$resources.readText("test/karma.conf.js");
			const karmaConf = _.template(karmaConfTemplate)({
				frameworks,
				testFiles,
				basePath: this.$projectData.getAppDirectoryRelativePath(),
			});

			this.$fs.writeFile(path.join(projectDir, "karma.conf.js"), karmaConf);
		}

		const exampleFilePath = this.$resources.resolvePath(
			`test/example.${frameworkToInstall}${projectFilesExtension}`,
		);
		const targetExampleTestPath = path.join(
			testsDir,
			`example.spec${projectFilesExtension}`,
		);

		if (shouldCreateSampleTests && this.$fs.exists(exampleFilePath)) {
			this.$fs.copyFile(exampleFilePath, targetExampleTestPath);
			const targetExampleTestRelativePath = path.relative(
				projectDir,
				targetExampleTestPath,
			);
			bufferedLogs.push(
				`Added example test: ${color.yellow(targetExampleTestRelativePath)}`,
			);
		}

		// test main entry
		const testMainResourcesPath = this.$resources.resolvePath(
			isVitest
				? `test/test-main.vitest${projectFilesExtension}`
				: `test/test-main${projectFilesExtension}`,
		);
		const testMainPath = path.join(
			this.$projectData.appDirectoryPath,
			`test${projectFilesExtension}`,
		);

		if (!this.$fs.exists(testMainPath)) {
			this.$fs.copyFile(testMainResourcesPath, testMainPath);
			const testMainRelativePath = path.relative(projectDir, testMainPath);
			bufferedLogs.push(
				`Main test entrypoint created: ${color.yellow(testMainRelativePath)}`,
			);
		}

		if (!isVitest || projectFilesExtension === ".ts") {
			const testTsConfigTemplate = this.$resources.readText(
				"test/tsconfig.spec.json",
			);
			const testTsConfig = _.template(testTsConfigTemplate)({
				basePath: this.$projectData.getAppDirectoryRelativePath(),
			});

			this.$fs.writeFile(
				path.join(projectDir, "tsconfig.spec.json"),
				testTsConfig,
			);
			bufferedLogs.push(`Added/replaced ${color.yellow("tsconfig.spec.json")}`);
		}

		const greyDollarSign = color.grey("$");
		const closingNotes = isVitest
			? [
					color.yellow(
						`Note: emulator/simulator test runs connect over the local loopback. When testing on a physical Android device, keep it connected over USB (adb reverse is set up automatically); for a physical iOS or visionOS device, pass a reachable 'url' to the coordinator in your test entry.`,
					),
					"",
					"",
					`You can now run your tests:`,
					"",
					`  ${greyDollarSign} ${color.green("ns test ios")}`,
					`  ${greyDollarSign} ${color.green("ns test android")}`,
					`  ${greyDollarSign} ${color.green("ns test visionos")}`,
					"",
					`or directly through Vitest (editor extensions, CI):`,
					"",
					`  ${greyDollarSign} ${color.green("NS_PLATFORM=ios npx vitest run")}`,
					"",
				]
			: [
					color.yellow(
						`Note: @nativescript/unit-test-runner was included in "dependencies" as a convenience to automatically adjust your app's Info.plist on iOS and AndroidManifest.xml on Android to ensure the socket connects properly.`,
					),
					"",
					color.yellow(
						`For production you may want to move to "devDependencies" and manage the settings yourself.`,
					),
					"",
					color.yellow(
						`Karma-based unit testing is deprecated and will be removed in a future release. Consider '$ ns test init --framework vitest'.`,
					),
					"",
					"",
					`You can now run your tests:`,
					"",
					`  ${greyDollarSign} ${color.green("ns test ios")}`,
					`  ${greyDollarSign} ${color.green("ns test android")}`,
					"",
				];

		this.$logger.info(
			[
				[
					color.green(`Tests using`),
					color.cyan(frameworkToInstall),
					color.green(`were successfully initialized.`),
				].join(" "),
				"",
				...bufferedLogs,
				"",
				...closingNotes,
			].join("\n"),
		);
	}
}

injector.registerCommand("test|init", TestInitCommand);
