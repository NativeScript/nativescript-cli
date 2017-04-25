import * as constants from "../constants";
import * as path from "path";
import * as shelljs from "shelljs";
import { exported } from "../common/decorators";

export class ProjectService implements IProjectService {

	constructor(private $npm: INodePackageManager,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $projectData: IProjectData,
		private $projectDataService: IProjectDataService,
		private $projectHelper: IProjectHelper,
		private $projectNameService: IProjectNameService,
		private $projectTemplatesService: IProjectTemplatesService,
		private $staticConfig: IStaticConfig) { }

	@exported("projectService")
	public async createProject(projectOptions: IProjectSettings): Promise<void> {
		let projectName = projectOptions.projectName,
			selectedTemplate = projectOptions.template;

		if (!projectName) {
			this.$errors.fail("You must specify <App name> when creating a new project.");
		}

		projectName = await this.$projectNameService.ensureValidName(projectName, { force: projectOptions.force });

		const selectedPath = path.resolve(projectOptions.pathToProject || ".");
		const projectDir = path.join(selectedPath, projectName);

		this.$fs.createDirectory(projectDir);

		if (this.$fs.exists(projectDir) && !this.$fs.isEmptyDir(projectDir)) {
			this.$errors.fail("Path already exists and is not empty %s", projectDir);
		}

		let projectId = projectOptions.appId || this.$projectHelper.generateDefaultAppId(projectName, constants.DEFAULT_APP_IDENTIFIER_PREFIX);
		this.createPackageJson(projectDir, projectId);

		this.$logger.trace(`Creating a new NativeScript project with name ${projectName} and id ${projectId} at location ${projectDir}`);
		if (!selectedTemplate) {
			selectedTemplate = constants.RESERVED_TEMPLATE_NAMES["default"];
		}

		try {
			let templatePath = await this.$projectTemplatesService.prepareTemplate(selectedTemplate, projectDir);
			await this.extractTemplate(projectDir, templatePath);

			await this.ensureAppResourcesExist(projectDir);

			let packageName = constants.TNS_CORE_MODULES_NAME;
			await this.$npm.install(packageName, projectDir, {
				save: true,
				"save-exact": true,
				disableNpmInstall: false,
				frameworkPath: null,
				ignoreScripts: projectOptions.ignoreScripts
			});

			let templatePackageJsonData = this.getDataFromJson(templatePath);
			this.mergeProjectAndTemplateProperties(projectDir, templatePackageJsonData); //merging dependencies from template (dev && prod)
			this.removeMergedDependencies(projectDir, templatePackageJsonData);

			await this.$npm.install(projectDir, projectDir, {
				disableNpmInstall: false,
				frameworkPath: null,
				ignoreScripts: projectOptions.ignoreScripts
			});

			let templatePackageJson = this.$fs.readJson(path.join(templatePath, "package.json"));
			await this.$npm.uninstall(templatePackageJson.name, { save: true }, projectDir);
		} catch (err) {
			this.$fs.deleteDirectory(projectDir);
			throw err;
		}

		this.$logger.printMarkdown("Project `%s` was successfully created.", projectName);
	}

	@exported("projectService")
	public isValidNativeScriptProject(pathToProject?: string): boolean {
		try {
			this.$projectData.initializeProjectData(pathToProject);
			return !!this.$projectData.projectDir && !!this.$projectData.projectId;
		} catch (e) {
			return false;
		}
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

	private async ensureAppResourcesExist(projectDir: string): Promise<void> {
		let appPath = path.join(projectDir, constants.APP_FOLDER_NAME),
			appResourcesDestinationPath = path.join(appPath, constants.APP_RESOURCES_FOLDER_NAME);

		if (!this.$fs.exists(appResourcesDestinationPath)) {
			this.$fs.createDirectory(appResourcesDestinationPath);

			// the template installed doesn't have App_Resources -> get from a default template
			let defaultTemplateName = constants.RESERVED_TEMPLATE_NAMES["default"];
			await this.$npm.install(defaultTemplateName, projectDir, {
				save: true,
				disableNpmInstall: false,
				frameworkPath: null,
				ignoreScripts: false
			});

			let defaultTemplateAppResourcesPath = path.join(projectDir, constants.NODE_MODULES_FOLDER_NAME,
				defaultTemplateName, constants.APP_RESOURCES_FOLDER_NAME);

			if (this.$fs.exists(defaultTemplateAppResourcesPath)) {
				shelljs.cp('-R', defaultTemplateAppResourcesPath, appPath);
			}

			await this.$npm.uninstall(defaultTemplateName, { save: true }, projectDir);
		}
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
		const projectFilePath = path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME);

		this.$fs.writeJson(projectFilePath, {
			"description": "NativeScript Application",
			"license": "SEE LICENSE IN <your-license-filename>",
			"readme": "NativeScript Application",
			"repository": "<fill-your-repository-here>"
		});

		this.$projectDataService.setNSValue(projectDir, "id", projectId);
	}
}
$injector.register("projectService", ProjectService);
