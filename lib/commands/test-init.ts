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
import {
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../common/define-command";
import { inject } from "../common/di";
import {
	IDictionary,
	IErrors,
	IFileSystem,
	IResourceLoader,
	IDependencyInformation,
} from "../common/declarations";
import { color } from "../color";

const karmaConfigAdditionalFrameworks: IDictionary<string[]> = {
	mocha: ["chai"],
};

const testInitCommandOptions = {
	framework: stringOption(),
} satisfies CommandOptionsSchema;

function setupTestInitCommand() {
	const services = {
		$errors: inject<IErrors>("errors"),
		$fs: inject<IFileSystem>("fs"),
		$logger: inject<ILogger>("logger"),
		$options: inject<IOptions>("options"),
		$packageManager: inject<INodePackageManager>("packageManager"),
		$pluginsService: inject<IPluginsService>("pluginsService"),
		$projectData: inject<IProjectData>("projectData"),
		$prompter: inject<IPrompter>("prompter"),
		$resources: inject<IResourceLoader>("resources"),
		$testInitializationService: inject<ITestInitializationService>(
			"testInitializationService",
		),
	};
	services.$projectData.initializeProjectData();

	return services;
}

type ITestInitCommandServices = ReturnType<typeof setupTestInitCommand>;

/**
 * Android blocks cleartext traffic by default (API 28+), which would
 * reject the runner's ws:// connection to the host. Scope the exception
 * to the emulator loopback alias and adb-reverse loopback only.
 */
function ensureAndroidNetworkSecurityConfig(
	services: ITestInitCommandServices,
	bufferedLogs: string[],
): void {
	const manifestPath = path.join(
		services.$projectData.appResourcesDirectoryPath,
		"Android",
		"src",
		"main",
		"AndroidManifest.xml",
	);
	if (!services.$fs.exists(manifestPath)) {
		bufferedLogs.push(
			color.yellow(
				"Could not locate App_Resources/Android/src/main/AndroidManifest.xml. For Android test runs, allow cleartext traffic to 10.0.2.2 and 127.0.0.1 via a network security config.",
			),
		);
		return;
	}

	const manifestContent = services.$fs.readText(manifestPath);
	if (manifestContent.indexOf("networkSecurityConfig") !== -1) {
		bufferedLogs.push(
			color.yellow(
				"AndroidManifest.xml already sets android:networkSecurityConfig — make sure it permits cleartext traffic to 10.0.2.2 and 127.0.0.1 for test runs.",
			),
		);
		return;
	}

	const xmlDirectory = path.join(
		services.$projectData.appResourcesDirectoryPath,
		"Android",
		"src",
		"main",
		"res",
		"xml",
	);
	services.$fs.ensureDirectoryExists(xmlDirectory);
	const securityConfigPath = path.join(xmlDirectory, "network_security.xml");
	if (!services.$fs.exists(securityConfigPath)) {
		services.$fs.copyFile(
			services.$resources.resolvePath("test/network_security.xml"),
			securityConfigPath,
		);
		bufferedLogs.push(
			`Added ${color.yellow("App_Resources/Android/src/main/res/xml/network_security.xml")}`,
		);
	}

	services.$fs.writeFile(
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

export const testInitCommandDefinition = defineCommand({
	name: "test|init",
	description: "Configures your project for unit testing.",
	options: testInitCommandOptions,
	arguments: "none",
	setup: setupTestInitCommand,
	async run(context, services: ITestInitCommandServices): Promise<void> {
		const projectDir = services.$projectData.projectDir;

		const frameworkToInstall =
			context.options.framework ||
			(await services.$prompter.promptForChoice(
				"Select testing framework:",
				TESTING_FRAMEWORKS,
			));
		if (TESTING_FRAMEWORKS.indexOf(frameworkToInstall) === -1) {
			services.$errors.failWithHelp(
				`Unknown or unsupported unit testing framework: ${frameworkToInstall}.`,
			);
		}

		const projectFilesExtension =
			services.$projectData.projectType === ProjectTypes.TsFlavorName ||
			services.$projectData.projectType === ProjectTypes.NgFlavorName
				? ".ts"
				: ".js";

		let modulesToInstall: IDependencyInformation[] = [];
		try {
			modulesToInstall =
				services.$testInitializationService.getDependencies(frameworkToInstall);
		} catch (err) {
			services.$errors.fail(
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
			await services.$packageManager.install(moduleToInstall, projectDir, {
				// Packages with native code must land in "dependencies" — the CLI
				// integrates plugin platform files (pods, aars) only from there.
				...(mod.saveInDependencies ? { save: true } : { "save-dev": true }),
				"save-exact": true,
				optional: false,
				disableNpmInstall: services.$options.disableNpmInstall,
				frameworkPath: services.$options.frameworkPath,
				ignoreScripts: services.$options.ignoreScripts,
				path: services.$options.path,
			});

			const modulePath = path.join(projectDir, "node_modules", mod.name);
			const modulePackageJsonPath = path.join(modulePath, "package.json");
			const modulePackageJsonContent = services.$fs.readJson(
				modulePackageJsonPath,
			);
			const modulePeerDependencies =
				modulePackageJsonContent.peerDependencies || {};
			const modulePeerDependenciesMeta =
				modulePackageJsonContent.peerDependenciesMeta || {};
			const projectPackageJson = services.$fs.readJson(
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
					await services.$packageManager.install(
						`${peerDependency}@${dependencyVersion}`,
						projectDir,
						{
							"save-dev": true,
							"save-exact": true,
							disableNpmInstall: false,
							frameworkPath: services.$options.frameworkPath,
							ignoreScripts: services.$options.ignoreScripts,
							path: services.$options.path,
						},
					);
				} catch (e) {
					services.$logger.error(e.message);
				}
			}
		}

		const isVitest = frameworkToInstall === "vitest";

		if (!isVitest) {
			// The Karma client only exists in the v4 line — v5+ is Vitest-only, so
			// an unpinned install would break these setups once v5 is `latest`.
			await services.$pluginsService.add(
				"@nativescript/unit-test-runner@^4.0.0",
				services.$projectData,
			);
		}

		services.$logger.clearScreen();

		const bufferedLogs = [];

		const testsDir = path.join(services.$projectData.appDirectoryPath, "tests");
		const projectTestsDir = path.relative(
			services.$projectData.projectDir,
			testsDir,
		);
		const relativeTestsDir = path.relative(
			services.$projectData.appDirectoryPath,
			testsDir,
		);
		let shouldCreateSampleTests = true;
		if (services.$fs.exists(testsDir)) {
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

		services.$fs.ensureDirectoryExists(testsDir);

		if (isVitest) {
			const vitestConfigResourcePath = services.$resources.resolvePath(
				"test/vitest.config.mts",
			);
			services.$fs.copyFile(
				vitestConfigResourcePath,
				path.join(projectDir, "vitest.config.mts"),
			);
			bufferedLogs.push(`Added/replaced ${color.yellow("vitest.config.mts")}`);
			ensureAndroidNetworkSecurityConfig(services, bufferedLogs);
		} else {
			const frameworks = [frameworkToInstall]
				.concat(karmaConfigAdditionalFrameworks[frameworkToInstall] || [])
				.map((fw) => `'${fw}'`)
				.join(", ");
			const testFiles = `'${fromWindowsRelativePathToUnix(
				relativeTestsDir,
			)}/**/*${projectFilesExtension}'`;
			const karmaConfTemplate =
				services.$resources.readText("test/karma.conf.js");
			const karmaConf = _.template(karmaConfTemplate)({
				frameworks,
				testFiles,
				basePath: services.$projectData.getAppDirectoryRelativePath(),
			});

			services.$fs.writeFile(path.join(projectDir, "karma.conf.js"), karmaConf);
		}

		const exampleFilePath = services.$resources.resolvePath(
			`test/example.${frameworkToInstall}${projectFilesExtension}`,
		);
		const targetExampleTestPath = path.join(
			testsDir,
			`example.spec${projectFilesExtension}`,
		);

		if (shouldCreateSampleTests && services.$fs.exists(exampleFilePath)) {
			services.$fs.copyFile(exampleFilePath, targetExampleTestPath);
			const targetExampleTestRelativePath = path.relative(
				projectDir,
				targetExampleTestPath,
			);
			bufferedLogs.push(
				`Added example test: ${color.yellow(targetExampleTestRelativePath)}`,
			);
		}

		// test main entry
		const testMainResourcesPath = services.$resources.resolvePath(
			isVitest
				? `test/test-main.vitest${projectFilesExtension}`
				: `test/test-main${projectFilesExtension}`,
		);
		const testMainPath = path.join(
			services.$projectData.appDirectoryPath,
			`test${projectFilesExtension}`,
		);

		if (!services.$fs.exists(testMainPath)) {
			services.$fs.copyFile(testMainResourcesPath, testMainPath);
			const testMainRelativePath = path.relative(projectDir, testMainPath);
			bufferedLogs.push(
				`Main test entrypoint created: ${color.yellow(testMainRelativePath)}`,
			);
		}

		if (!isVitest || projectFilesExtension === ".ts") {
			const testTsConfigTemplate = services.$resources.readText(
				"test/tsconfig.spec.json",
			);
			const testTsConfig = _.template(testTsConfigTemplate)({
				basePath: services.$projectData.getAppDirectoryRelativePath(),
			});

			services.$fs.writeFile(
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

		services.$logger.info(
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
	},
});
