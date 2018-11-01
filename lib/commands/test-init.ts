import * as path from 'path';
import { TESTING_FRAMEWORKS } from '../constants';

class TestInitCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	private frameworkDependencies: IDictionary<string[]> = {
		mocha: ['karma-chai', 'mocha'],
	};

	private karmaConfigAdditionalFrameworks: IDictionary<string[]> = {
		mocha: ['chai']
	};

	constructor(private $npm: INodePackageManager,
		private $projectData: IProjectData,
		private $errors: IErrors,
		private $options: IOptions,
		private $prompter: IPrompter,
		private $fs: IFileSystem,
		private $resources: IResourceLoader,
		private $pluginsService: IPluginsService,
		private $logger: ILogger) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		const projectDir = this.$projectData.projectDir;

		const frameworkToInstall = this.$options.framework ||
			await this.$prompter.promptForChoice('Select testing framework:', TESTING_FRAMEWORKS);
		if (TESTING_FRAMEWORKS.indexOf(frameworkToInstall) === -1) {
			this.$errors.fail(`Unknown or unsupported unit testing framework: ${frameworkToInstall}`);
		}

		const dependencies = this.frameworkDependencies[frameworkToInstall] || [];
		const modulesToInstall: IDependencyInformation[] = [
			{
				name: 'karma',
				// Hardcode the version unitl https://github.com/karma-runner/karma/issues/3052 is fixed
				version: "2.0.2"
			},
			{
				name: `karma-${frameworkToInstall}`
			},
			{
				name: 'karma-nativescript-launcher'
			}
		];

		modulesToInstall.push(...dependencies.map(f => ({ name: f })));

		for (const mod of modulesToInstall) {
			let moduleToInstall = mod.name;
			if (mod.version) {
				moduleToInstall += `@${mod.version}`;
			}
			await this.$npm.install(moduleToInstall, projectDir, {
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
				const dependencyVersion = modulePeerDependencies[peerDependency] || "*";

				// catch errors when a peerDependency is already installed
				// e.g karma is installed; karma-jasmine depends on karma and will try to install it again
				try {
					await this.$npm.install(`${peerDependency}@${dependencyVersion}`, projectDir, {
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

		await this.$pluginsService.add('nativescript-unit-test-runner', this.$projectData);

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
		const testFiles = `'${relativeTestsDir}/**/*.js'`;
		const karmaConfTemplate = this.$resources.readText('test/karma.conf.js');
		const karmaConf = _.template(karmaConfTemplate)({ frameworks, testFiles });

		this.$fs.writeFile(path.join(projectDir, 'karma.conf.js'), karmaConf);

		const exampleFilePath = this.$resources.resolvePath(`test/example.${frameworkToInstall}.js`);

		if (shouldCreateSampleTests && this.$fs.exists(exampleFilePath)) {
			this.$fs.copyFile(exampleFilePath, path.join(testsDir, 'example.js'));
			this.$logger.info(`\nExample test file created in ${relativeTestsDir}`.yellow);
		} else {
			this.$logger.info(`\nPlace your test files under ${relativeTestsDir}`.yellow);
		}

		this.$logger.info('Run your tests using the "$ tns test <platform>" command.'.yellow);
	}
}

$injector.registerCommand("test|init", TestInitCommand);
