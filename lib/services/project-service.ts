import * as constants from "../constants";
import * as path from "path";
import * as shelljs from "shelljs";
import { exported } from "../common/decorators";
import { Hooks } from "../constants";

export class ProjectService implements IProjectService {

	constructor(private $hooksService: IHooksService,
		private $npm: INodePackageManager,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $projectDataService: IProjectDataService,
		private $projectHelper: IProjectHelper,
		private $projectNameService: IProjectNameService,
		private $projectTemplatesService: IProjectTemplatesService,
		private $staticConfig: IStaticConfig,
		private $npmInstallationManager: INpmInstallationManager) { }

	@exported("projectService")
	public async createProject(projectOptions: IProjectSettings): Promise<ICreateProjectData> {
		let projectName = projectOptions.projectName;
		let selectedTemplate = projectOptions.template;

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

		const appId = projectOptions.appId || this.$projectHelper.generateDefaultAppId(projectName, constants.DEFAULT_APP_IDENTIFIER_PREFIX);
		this.createPackageJson(projectDir, appId);
		this.$logger.trace(`Creating a new NativeScript project with name ${projectName} and id ${appId} at location ${projectDir}`);
		if (!selectedTemplate) {
			selectedTemplate = constants.RESERVED_TEMPLATE_NAMES["default"];
		}

		const projectCreationData = await this.createProjectCore({ template: selectedTemplate, projectDir, ignoreScripts: projectOptions.ignoreScripts, appId: appId, projectName });

		this.$logger.printMarkdown("Project `%s` was successfully created.", projectCreationData.projectName);

		return projectCreationData;
	}

	private async createProjectCore(projectCreationSettings: IProjectCreationSettings): Promise<ICreateProjectData> {
		const { template, projectDir, appId, projectName, ignoreScripts } = projectCreationSettings;

		try {
			const { templatePath, templateVersion } = await this.$projectTemplatesService.prepareTemplate(template, projectDir);
			await this.extractTemplate(projectDir, templatePath, templateVersion);

			await this.ensureAppResourcesExist(projectDir);

			const templatePackageJsonData = this.getDataFromJson(templatePath);

			if (!(templatePackageJsonData && templatePackageJsonData.dependencies && templatePackageJsonData.dependencies[constants.TNS_CORE_MODULES_NAME])) {
				await this.$npmInstallationManager.install(constants.TNS_CORE_MODULES_NAME, projectDir, { dependencyType: "save" });
			}

			if (templateVersion === constants.TemplateVersions.v1) {
				this.mergeProjectAndTemplateProperties(projectDir, templatePackageJsonData); // merging dependencies from template (dev && prod)
				this.removeMergedDependencies(projectDir, templatePackageJsonData);
			}

			const templatePackageJson = this.$fs.readJson(path.join(templatePath, constants.PACKAGE_JSON_FILE_NAME));

			// Install devDependencies and execute all scripts:
			await this.$npm.install(projectDir, projectDir, {
				disableNpmInstall: false,
				frameworkPath: null,
				ignoreScripts
			});

			await this.$npm.uninstall(templatePackageJson.name, { save: true }, projectDir);
			if (templateVersion === constants.TemplateVersions.v2) {
				this.alterPackageJsonData(projectDir, appId);
			}
		} catch (err) {
			this.$fs.deleteDirectory(projectDir);
			throw err;
		}

		this.$hooksService.executeAfterHooks(Hooks.createProject, {
			hookArgs: projectCreationSettings
		});

		return { projectName, projectDir };
	}

	@exported("projectService")
	public isValidNativeScriptProject(pathToProject?: string): boolean {
		try {
			const projectData = this.$projectDataService.getProjectData(pathToProject);

			return !!projectData && !!projectData.projectDir && !!projectData.projectId;
		} catch (e) {
			return false;
		}
	}

	private getDataFromJson(templatePath: string): any {
		const templatePackageJsonPath = path.join(templatePath, constants.PACKAGE_JSON_FILE_NAME);
		if (this.$fs.exists(templatePackageJsonPath)) {
			const templatePackageJsonData = this.$fs.readJson(templatePackageJsonPath);
			return templatePackageJsonData;
		} else {
			this.$logger.trace(`Template ${templatePath} does not have ${constants.PACKAGE_JSON_FILE_NAME} file.`);
		}

		return null;
	}

	private async extractTemplate(projectDir: string, realTemplatePath: string, templateVersion: string): Promise<void> {
		this.$fs.ensureDirectoryExists(projectDir);

		this.$logger.trace(`Template version is ${templateVersion}`);
		let destinationDir = "";
		switch (templateVersion) {
			case constants.TemplateVersions.v1:
				const projectData = this.$projectDataService.getProjectData(projectDir);
				const appDestinationPath = projectData.getAppDirectoryPath(projectDir);
				this.$fs.createDirectory(appDestinationPath);
				destinationDir = appDestinationPath;
				break;
			case constants.TemplateVersions.v2:
			default:
				destinationDir = projectDir;
				break;
		}

		this.$logger.trace(`Copying application from '${realTemplatePath}' into '${destinationDir}'.`);
		shelljs.cp('-R', path.join(realTemplatePath, "*"), destinationDir);

		this.$fs.createDirectory(path.join(projectDir, "platforms"));
	}

	private async ensureAppResourcesExist(projectDir: string): Promise<void> {
		const projectData = this.$projectDataService.getProjectData(projectDir);
		const appPath = projectData.getAppDirectoryPath(projectDir);
		const appResourcesDestinationPath = projectData.getAppResourcesDirectoryPath(projectDir);

		if (!this.$fs.exists(appResourcesDestinationPath)) {
			this.$fs.createDirectory(appResourcesDestinationPath);

			// the template installed doesn't have App_Resources -> get from a default template
			const defaultTemplateName = constants.RESERVED_TEMPLATE_NAMES["default"];
			await this.$npm.install(defaultTemplateName, projectDir, {
				save: true,
				disableNpmInstall: false,
				frameworkPath: null,
				ignoreScripts: false
			});

			const defaultTemplatePath = path.join(projectDir, constants.NODE_MODULES_FOLDER_NAME, defaultTemplateName);
			const defaultTemplateVersion = this.$projectTemplatesService.getTemplateVersion(defaultTemplatePath);

			let defaultTemplateAppResourcesPath: string = null;
			switch (defaultTemplateVersion) {
				case constants.TemplateVersions.v1:
					defaultTemplateAppResourcesPath = path.join(projectDir,
						constants.NODE_MODULES_FOLDER_NAME,
						defaultTemplateName,
						constants.APP_RESOURCES_FOLDER_NAME);
					break;
				case constants.TemplateVersions.v2:
				default:
					const defaultTemplateProjectData = this.$projectDataService.getProjectData(defaultTemplatePath);
					defaultTemplateAppResourcesPath = defaultTemplateProjectData.appResourcesDirectoryPath;
			}

			if (defaultTemplateAppResourcesPath && this.$fs.exists(defaultTemplateAppResourcesPath)) {
				shelljs.cp('-R', defaultTemplateAppResourcesPath, appPath);
			}

			await this.$npm.uninstall(defaultTemplateName, { save: true }, projectDir);
		}
	}

	private removeMergedDependencies(projectDir: string, templatePackageJsonData: any): void {
		const appDirectoryPath = this.$projectDataService.getProjectData(projectDir).appDirectoryPath;
		const extractedTemplatePackageJsonPath = path.join(appDirectoryPath, constants.PACKAGE_JSON_FILE_NAME);
		for (const key in templatePackageJsonData) {
			if (constants.PackageJsonKeysToKeep.indexOf(key) === -1) {
				delete templatePackageJsonData[key];
			}
		}

		this.$logger.trace("Deleting unnecessary information from template json.");
		this.$fs.writeJson(extractedTemplatePackageJsonPath, templatePackageJsonData);
	}

	private mergeProjectAndTemplateProperties(projectDir: string, templatePackageJsonData: any): void {
		if (templatePackageJsonData) {
			const projectPackageJsonPath = path.join(projectDir, constants.PACKAGE_JSON_FILE_NAME);
			const projectPackageJsonData = this.$fs.readJson(projectPackageJsonPath);
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
		const sortedDeps: IStringDictionary = {};
		const dependenciesNames = _.keys(projectDependencies).sort();
		_.each(dependenciesNames, (key: string) => {
			sortedDeps[key] = projectDependencies[key];
		});
		this.$logger.trace("Sorted merged dependencies are: ", <any>sortedDeps);
		return sortedDeps;
	}

	private createPackageJson(projectDir: string, projectId: string): void {
		const projectFilePath = path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME);

		this.$fs.writeJson(projectFilePath, this.packageJsonDefaultData);

		this.setAppId(projectDir, projectId);
	}

	private get packageJsonDefaultData(): IStringDictionary {
		return {
			description: "NativeScript Application",
			license: "SEE LICENSE IN <your-license-filename>",
			readme: "NativeScript Application",
			repository: "<fill-your-repository-here>"
		};
	}

	private alterPackageJsonData(projectDir: string, projectId: string): void {
		const projectFilePath = path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME);

		const packageJsonData = this.$fs.readJson(projectFilePath);

		// Remove the metadata keys from the package.json
		let updatedPackageJsonData = _.omitBy<any, any>(packageJsonData, (value: any, key: string) => _.startsWith(key, "_"));
		updatedPackageJsonData = _.merge(updatedPackageJsonData, this.packageJsonDefaultData);

		if (updatedPackageJsonData.nativescript && updatedPackageJsonData.nativescript.templateVersion) {
			delete updatedPackageJsonData.nativescript.templateVersion;
		}

		this.$fs.writeJson(projectFilePath, updatedPackageJsonData);
		this.setAppId(projectDir, projectId);
	}

	private setAppId(projectDir: string, projectId: string): void {
		this.$projectDataService.setNSValue(projectDir, "id", projectId);
	}
}
$injector.register("projectService", ProjectService);
