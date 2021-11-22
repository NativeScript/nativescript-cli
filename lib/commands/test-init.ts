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

class TestInitCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	private karmaConfigAdditionalFrameworks: IDictionary<string[]> = {
		mocha: ["chai"],
	};

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
		private $testInitializationService: ITestInitializationService
	) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		const projectDir = this.$projectData.projectDir;

		const frameworkToInstall =
			this.$options.framework ||
			(await this.$prompter.promptForChoice(
				"Select testing framework:",
				TESTING_FRAMEWORKS
			));
		if (TESTING_FRAMEWORKS.indexOf(frameworkToInstall) === -1) {
			this.$errors.failWithHelp(
				`Unknown or unsupported unit testing framework: ${frameworkToInstall}.`
			);
		}

		const projectFilesExtension =
			this.$projectData.projectType === ProjectTypes.TsFlavorName ||
			this.$projectData.projectType === ProjectTypes.NgFlavorName
				? ".ts"
				: ".js";

		let modulesToInstall: IDependencyInformation[] = [];
		try {
			modulesToInstall = this.$testInitializationService.getDependencies(
				frameworkToInstall
			);
		} catch (err) {
			this.$errors.fail(
				`Unable to install the unit testing dependencies. Error: '${err.message}'`
			);
		}

		modulesToInstall = modulesToInstall.filter(
			(moduleToInstall) =>
				!moduleToInstall.projectType ||
				moduleToInstall.projectType === projectFilesExtension
		);

		for (const mod of modulesToInstall) {
			let moduleToInstall = mod.name;
			moduleToInstall += `@${mod.version}`;
			await this.$packageManager.install(moduleToInstall, projectDir, {
				"save-dev": true,
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

			for (const peerDependency in modulePeerDependencies) {
				const isPeerDependencyExcluded = _.includes(
					mod.excludedPeerDependencies,
					peerDependency
				);
				if (isPeerDependencyExcluded) {
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
						}
					);
				} catch (e) {
					this.$logger.error(e.message);
				}
			}
		}

		await this.$pluginsService.add(
			"@nativescript/unit-test-runner",
			this.$projectData
		);

		const testsDir = path.join(this.$projectData.appDirectoryPath, "tests");
		const projectTestsDir = path.relative(
			this.$projectData.projectDir,
			testsDir
		);
		const relativeTestsDir = path.relative(
			this.$projectData.appDirectoryPath,
			testsDir
		);
		let shouldCreateSampleTests = true;
		if (this.$fs.exists(testsDir)) {
			this.$logger.info(
				`${projectTestsDir} directory already exists, will not create an example test project.`
			);
			shouldCreateSampleTests = false;
		}

		this.$fs.ensureDirectoryExists(testsDir);

		const frameworks = [frameworkToInstall]
			.concat(this.karmaConfigAdditionalFrameworks[frameworkToInstall] || [])
			.map((fw) => `'${fw}'`)
			.join(", ");
		const testFiles = `'${fromWindowsRelativePathToUnix(
			relativeTestsDir
		)}/**/*${projectFilesExtension}'`;
		const karmaConfTemplate = this.$resources.readText("test/karma.conf.js");
		const karmaConf = _.template(karmaConfTemplate)({
			frameworks,
			testFiles,
			basePath: this.$projectData.getAppDirectoryRelativePath(),
		});

		this.$fs.writeFile(path.join(projectDir, "karma.conf.js"), karmaConf);

		const exampleFilePath = this.$resources.resolvePath(
			`test/example.${frameworkToInstall}${projectFilesExtension}`
		);
		const targetExampleTestPath = path.join(
			testsDir,
			`example.spec${projectFilesExtension}`
		);

		if (shouldCreateSampleTests && this.$fs.exists(exampleFilePath)) {
			this.$fs.copyFile(exampleFilePath, targetExampleTestPath);
			this.$logger.info(
				`\nExample test added: ${targetExampleTestPath}`.yellow
			);
		} else {
			this.$logger.info(
				`\nCreate filename.spec${projectFilesExtension} files anywhere you'd like.`
					.yellow
			);
		}

		// test main entry
		const testMainResourcesPath = this.$resources.resolvePath(
			`test/test-main${projectFilesExtension}`
		);
		const testMainPath = path.join(
			this.$projectData.appDirectoryPath,
			`test${projectFilesExtension}`
		);

		if (!this.$fs.exists(testMainPath)) {
			this.$fs.copyFile(testMainResourcesPath, testMainPath);
			this.$logger.info(
				`\nMain test entrypoint created: ${path.join(
					this.$projectData.appDirectoryPath,
					`test${projectFilesExtension}`
				)}`.yellow
			);
		}

		const testTsConfigTemplate = this.$resources.readText(
			"test/tsconfig.spec.json"
		);
		const testTsConfig = _.template(testTsConfigTemplate)({
			basePath: this.$projectData.getAppDirectoryRelativePath(),
		});

		this.$fs.writeFile(
			path.join(projectDir, "tsconfig.spec.json"),
			testTsConfig
		);
		this.$logger.info(`\nAdded/replaced tsconfig.spec.json`.yellow);

		this.$logger.info(
			`\nNOTE: @nativescript/unit-test-runner was included in "dependencies" as a convenience to automatically adjust your app's Info.plist on iOS and AndroidManifest.xml on Android to ensure the socket connects properly. For production you may want to move to "devDependencies" and manage the settings yourself.`
				.yellow
		);

		this.$logger.info(
			'\nRun your tests using the "$ ns test <platform>" command.'.yellow
		);
	}
}

injector.registerCommand("test|init", TestInitCommand);
