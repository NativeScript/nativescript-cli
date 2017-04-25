import * as path from 'path';
import { TESTING_FRAMEWORKS } from '../constants';

class TestInitCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	private frameworkDependencies: IDictionary<string[]> = {
		mocha: ['chai'],
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
		let projectDir = this.$projectData.projectDir;

		let frameworkToInstall = this.$options.framework ||
			await this.$prompter.promptForChoice('Select testing framework:', TESTING_FRAMEWORKS);
		if (TESTING_FRAMEWORKS.indexOf(frameworkToInstall) === -1) {
			this.$errors.fail(`Unknown or unsupported unit testing framework: ${frameworkToInstall}`);
		}

		let dependencies = this.frameworkDependencies[frameworkToInstall] || [];
		let modulesToInstall = ['karma', 'karma-' + frameworkToInstall, 'karma-nativescript-launcher'].concat(dependencies.map(f => 'karma-' + f));

		for (let mod of modulesToInstall) {
			await this.$npm.install(mod, projectDir, {
				'save-dev': true,
				optional: false,
			});

			const modulePath = path.join(projectDir, "node_modules", mod);
			const modulePackageJsonPath = path.join(modulePath, "package.json");
			const modulePackageJsonContent = this.$fs.readJson(modulePackageJsonPath);
			const modulePeerDependencies = modulePackageJsonContent.peerDependencies || {};

			for (let peerDependency in modulePeerDependencies) {
				let dependencyVersion = modulePeerDependencies[peerDependency] || "*";

				// catch errors when a peerDependency is already installed
				// e.g karma is installed; karma-jasmine depends on karma and will try to install it again
				try {
					await this.$npm.install(`${peerDependency}@${dependencyVersion}`, projectDir, {
						'save-dev': true
					});
				} catch (e) {
					this.$logger.info(e.message);
				}
			}
		}

		await this.$pluginsService.add('nativescript-unit-test-runner', this.$projectData);

		let testsDir = path.join(projectDir, 'app/tests');
		let shouldCreateSampleTests = true;
		if (this.$fs.exists(testsDir)) {
			this.$logger.info('app/tests/ directory already exists, will not create an example test project.');
			shouldCreateSampleTests = false;
		}

		this.$fs.ensureDirectoryExists(testsDir);

		let karmaConfTemplate = this.$resources.readText('test/karma.conf.js');
		let karmaConf = _.template(karmaConfTemplate)({
			frameworks: [frameworkToInstall].concat(dependencies)
				.map(fw => `'${fw}'`)
				.join(', ')
		});

		this.$fs.writeFile(path.join(projectDir, 'karma.conf.js'), karmaConf);

		let exampleFilePath = this.$resources.resolvePath(`test/example.${frameworkToInstall}.js`);

		if (shouldCreateSampleTests && this.$fs.exists(exampleFilePath)) {
			this.$fs.copyFile(exampleFilePath, path.join(testsDir, 'example.js'));
			this.$logger.info('\nExample test file created in app/tests/'.yellow);
		} else {
			this.$logger.info('\nPlace your test files under app/tests/'.yellow);
		}

		this.$logger.info('Run your tests using the "$ tns test <platform>" command.'.yellow);
	}
}

$injector.registerCommand("test|init", TestInitCommand);
