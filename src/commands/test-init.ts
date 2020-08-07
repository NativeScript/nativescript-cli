import * as path from 'path';
import { TESTING_FRAMEWORKS, ProjectTypes } from '../constants';
import { fromWindowsRelativePathToUnix } from '../common/helpers';
import { INodePackageManager, IOptions } from "../declarations";
import { IProjectData, ITestInitializationService } from "../definitions/project";
import { IDependencyInformation, IDictionary, IErrors, IFileSystem, IResourceLoader } from "../common/declarations";
import { IPluginsService } from "../definitions/plugins";

import { ICommand, ICommandParameter } from "../common/definitions/commands";
import * as _ from "lodash";

class TestInitCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	private karmaConfigAdditionalFrameworks: IDictionary<string[]> = {
		mocha: ['chai']
	};

	constructor(private $packageManager: INodePackageManager,
		private $projectData: IProjectData,
		private $errors: IErrors,
		private $options: IOptions,
		private $prompter: IPrompter,
		private $fs: IFileSystem,
		private $resources: IResourceLoader,
		private $pluginsService: IPluginsService,
		private $logger: ILogger,
		private $testInitializationService: ITestInitializationService) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		const projectDir = this.$projectData.projectDir;

		const frameworkToInstall = this.$options.framework ||
			await this.$prompter.promptForChoice('Select testing framework:', TESTING_FRAMEWORKS);
		if (TESTING_FRAMEWORKS.indexOf(frameworkToInstall) === -1) {
			this.$errors.failWithHelp(`Unknown or unsupported unit testing framework: ${frameworkToInstall}.`);
		}

		const projectFilesExtension = this.$projectData.projectType === ProjectTypes.TsFlavorName || this.$projectData.projectType === ProjectTypes.NgFlavorName ? ".ts" : ".js";

		let modulesToInstall: IDependencyInformation[] = [];
		try {
			modulesToInstall = this.$testInitializationService.getDependencies(frameworkToInstall);
		} catch (err) {
			this.$errors.fail(`Unable to install the unit testing dependencies. Error: '${err.message}'`);
		}

		modulesToInstall = modulesToInstall.filter(moduleToInstall => !moduleToInstall.projectType || moduleToInstall.projectType === projectFilesExtension);

		for (const mod of modulesToInstall) {
			let moduleToInstall = mod.name;
			moduleToInstall += `@${mod.version}`;
			await this.$packageManager.install(moduleToInstall, projectDir, {
				'save-dev': true,
				'save-exact': true,
				optional: false,
				disableNpmInstall: this.$options.disableNpmInstall,
				frameworkPath: this.$options.frameworkPath,
				ignoreScripts: this.$options.ignoreScripts,
				path: this.$options.path
			});

			const modulePath = path.join(projectDir, "node_modules", mod.name);
			const modulePackageJsonPath = path.join(modulePath, "package.json");
			const modulePackageJsonContent = this.$fs.readJson(modulePackageJsonPath);
			const modulePeerDependencies = modulePackageJsonContent.peerDependencies || {};

			for (const peerDependency in modulePeerDependencies) {
				const isPeerDependencyExcluded = _.includes(mod.excludedPeerDependencies, peerDependency);
				if (isPeerDependencyExcluded) {
					continue;
				}

				const dependencyVersion = modulePeerDependencies[peerDependency] || "*";

				// catch errors when a peerDependency is already installed
				// e.g karma is installed; karma-jasmine depends on karma and will try to install it again
				try {
					await this.$packageManager.install(`${peerDependency}@${dependencyVersion}`, projectDir, {
						'save-dev': true,
						'save-exact': true,
						disableNpmInstall: false,
						frameworkPath: this.$options.frameworkPath,
						ignoreScripts: this.$options.ignoreScripts,
						path: this.$options.path
					});
				} catch (e) {
					this.$logger.error(e.message);
				}
			}
		}

		await this.$pluginsService.add('@nativescript/unit-test-runner', this.$projectData);

		const testsDir = path.join(this.$projectData.appDirectoryPath, 'tests');
		const relativeTestsDir = path.relative(this.$projectData.projectDir, testsDir);
		let shouldCreateSampleTests = true;
		if (this.$fs.exists(testsDir)) {
			this.$logger.info(`${relativeTestsDir} directory already exists, will not create an example test project.`);
			shouldCreateSampleTests = false;
		}

		this.$fs.ensureDirectoryExists(testsDir);

		const frameworks = [frameworkToInstall].concat(this.karmaConfigAdditionalFrameworks[frameworkToInstall] || [])
			.map(fw => `'${fw}'`)
			.join(', ');
		const testFiles = `'${fromWindowsRelativePathToUnix(relativeTestsDir)}/**/*${projectFilesExtension}'`;
		const karmaConfTemplate = this.$resources.readText('test/karma.conf.js');
		const karmaConf = _.template(karmaConfTemplate)({ frameworks, testFiles });

		this.$fs.writeFile(path.join(projectDir, 'karma.conf.js'), karmaConf);

		const exampleFilePath = this.$resources.resolvePath(`test/example.${frameworkToInstall}${projectFilesExtension}`);

		if (shouldCreateSampleTests && this.$fs.exists(exampleFilePath)) {
			this.$fs.copyFile(exampleFilePath, path.join(testsDir, `example${projectFilesExtension}`));
			this.$logger.info(`\nExample test file created in ${relativeTestsDir}`.yellow);
		} else {
			this.$logger.info(`\nPlace your test files under ${relativeTestsDir}`.yellow);
		}

		this.$logger.info('Run your tests using the "$ ns test <platform>" command.'.yellow);
	}
}

$injector.registerCommand("test|init", TestInitCommand);
