import * as constants from "../constants";
import * as path from "path";
import * as shelljs from "shelljs";

export class ProjectService implements IProjectService {

	constructor(private $npm: INodePackageManager,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $projectDataService: IProjectDataService,
		private $projectHelper: IProjectHelper,
		private $projectNameService: IProjectNameService,
		private $projectTemplatesService: IProjectTemplatesService,
		private $options: IOptions) { }

	public async createProject(projectName: string, selectedTemplate?: string): Promise<void> {
		if (!projectName) {
			this.$errors.fail("You must specify <App name> when creating a new project.");
		}
		projectName = await this.$projectNameService.ensureValidName(projectName, { force: this.$options.force });

		let projectDir = path.join(path.resolve(this.$options.path || "."), projectName);
		this.$fs.createDirectory(projectDir);
		if (this.$fs.exists(projectDir) && !this.$fs.isEmptyDir(projectDir)) {
			this.$errors.fail("Path already exists and is not empty %s", projectDir);
		}

		let projectId = this.$options.appid || this.$projectHelper.generateDefaultAppId(projectName, constants.DEFAULT_APP_IDENTIFIER_PREFIX);
		this.createPackageJson(projectDir, projectId);

		this.$logger.trace(`Creating a new NativeScript project with name ${projectName} and id ${projectId} at location ${projectDir}`);
		if (!selectedTemplate) {
			selectedTemplate = constants.RESERVED_TEMPLATE_NAMES["default"];
		}

		try {
			let templatePath = await this.$projectTemplatesService.prepareTemplate(selectedTemplate, projectDir);
			await this.extractTemplate(projectDir, templatePath);

			let packageName = constants.TNS_CORE_MODULES_NAME;
			await this.$npm.install(packageName, projectDir, { save: true, "save-exact": true });

			let templatePackageJsonData = this.getDataFromJson(templatePath);
			this.mergeProjectAndTemplateProperties(projectDir, templatePackageJsonData); //merging dependencies from template (dev && prod)
			this.removeMergedDependencies(projectDir, templatePackageJsonData);

			await this.$npm.install(projectDir, projectDir, { "ignore-scripts": this.$options.ignoreScripts });

			let templatePackageJson = this.$fs.readJson(path.join(templatePath, "package.json"));
			await this.$npm.uninstall(templatePackageJson.name, { save: true }, projectDir);
		} catch (err) {
			this.$fs.deleteDirectory(projectDir);
			throw err;
		}
		this.$logger.printMarkdown("Project `%s` was successfully created.", projectName);
	}

	private getDataFromJson(templatePath: string): any {
		let templatePackageJsonPath = path.join(templatePath, constants.PACKAGE_JSON_FILE_NAME);
		if (this.$fs.exists(templatePackageJsonPath)) {
			let templatePackageJsonData = this.$fs.readJson(templatePackageJsonPath);
			return templatePackageJsonData;
		} else {
			this.$logger.trace(`Template ${templatePath} does not have ${constants.PACKAGE_JSON_FILE_NAME} file.`);
		}
		return null;
	}

	private async extractTemplate(projectDir: string, realTemplatePath: string): Promise<void> {
		this.$fs.ensureDirectoryExists(projectDir);

		let appDestinationPath = path.join(projectDir, constants.APP_FOLDER_NAME);
		this.$fs.createDirectory(appDestinationPath);

		this.$logger.trace(`Copying application from '${realTemplatePath}' into '${appDestinationPath}'.`);
		shelljs.cp('-R', path.join(realTemplatePath, "*"), appDestinationPath);

		this.$fs.createDirectory(path.join(projectDir, "platforms"));
	}

	private removeMergedDependencies(projectDir: string, templatePackageJsonData: any): void {
		let extractedTemplatePackageJsonPath = path.join(projectDir, constants.APP_FOLDER_NAME, constants.PACKAGE_JSON_FILE_NAME);
		for (let key in templatePackageJsonData) {
			if (constants.PackageJsonKeysToKeep.indexOf(key) === -1) {
				delete templatePackageJsonData[key];
			}
		}

		this.$logger.trace("Deleting unnecessary information from template json.");
		this.$fs.writeJson(extractedTemplatePackageJsonPath, templatePackageJsonData);
	}

	private mergeProjectAndTemplateProperties(projectDir: string, templatePackageJsonData: any): void {
		if (templatePackageJsonData) {
			let projectPackageJsonPath = path.join(projectDir, constants.PACKAGE_JSON_FILE_NAME);
			let projectPackageJsonData = this.$fs.readJson(projectPackageJsonPath);
			this.$logger.trace("Initial project package.json data: ", projectPackageJsonData);
			if (projectPackageJsonData.dependencies || templatePackageJsonData.dependencies) {
				projectPackageJsonData.dependencies = this.mergeDependencies(projectPackageJsonData.dependencies, templatePackageJsonData.dependencies);
			}

			if (projectPackageJsonData.devDependencies || templatePackageJsonData.devDependencies) {
				projectPackageJsonData.devDependencies = this.mergeDependencies(projectPackageJsonData.devDependencies, templatePackageJsonData.devDependencies);
			}
			this.$logger.trace("New project package.json data: ", projectPackageJsonData);
			this.$fs.writeJson(projectPackageJsonPath, projectPackageJsonData);
		} else {
			this.$errors.failWithoutHelp(`Couldn't find package.json data in installed template`);
		}
	}

	private mergeDependencies(projectDependencies: IStringDictionary, templateDependencies: IStringDictionary): IStringDictionary {
		// Cast to any when logging as logger thinks it can print only string.
		// Cannot use toString() because we want to print the whole objects, not [Object object]
		this.$logger.trace("Merging dependencies, projectDependencies are: ", <any>projectDependencies, " templateDependencies are: ", <any>templateDependencies);
		projectDependencies = projectDependencies || {};
		_.extend(projectDependencies, templateDependencies || {});
		let sortedDeps: IStringDictionary = {};
		let dependenciesNames = _.keys(projectDependencies).sort();
		_.each(dependenciesNames, (key: string) => {
			sortedDeps[key] = projectDependencies[key];
		});
		this.$logger.trace("Sorted merged dependencies are: ", <any>sortedDeps);
		return sortedDeps;
	}

	private createPackageJson(projectDir: string, projectId: string): void {
		this.$projectDataService.initialize(projectDir);
		this.$projectDataService.setValue("id", projectId);
	}
}
$injector.register("projectService", ProjectService);
