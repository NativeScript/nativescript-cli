import * as constants from "../constants";
import * as path from "path";
import * as shelljs from "shelljs";
import { format } from "util";
import { exported } from "../common/decorators";
import { Hooks, TemplatesV2PackageJsonKeysToRemove } from "../constants";
import { performanceLog } from "../common/decorators";
import { IProjectService, IProjectDataService, IProjectTemplatesService, ICreateProjectData, IProjectSettings, IProjectCreationSettings, ITemplateData } from "../definitions/project";
import { INodePackageManager, IProjectNameService, IStaticConfig } from "../declarations";
import { IHooksService, IErrors, IFileSystem, IProjectHelper, IStringDictionary } from "../common/declarations";
import * as _ from 'lodash';
import { injector } from "../common/yok";

export class ProjectService implements IProjectService {

	constructor(private $hooksService: IHooksService,
		private $packageManager: INodePackageManager,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $pacoteService: IPacoteService,
		private $projectDataService: IProjectDataService,
		private $projectHelper: IProjectHelper,
		private $projectNameService: IProjectNameService,
		private $projectTemplatesService: IProjectTemplatesService,
		private $staticConfig: IStaticConfig,
		private $tempService: ITempService) { }

	public async validateProjectName(opts: { projectName: string, force: boolean, pathToProject: string }): Promise<string> {
		let projectName = opts.projectName;
		if (!projectName) {
			this.$errors.failWithHelp("You must specify <App name> when creating a new project.");
		}

		projectName = await this.$projectNameService.ensureValidName(projectName, { force: opts.force });
		const projectDir = this.getValidProjectDir(opts.pathToProject, projectName);
		if (this.$fs.exists(projectDir) && !this.$fs.isEmptyDir(projectDir)) {
			this.$errors.fail("Path already exists and is not empty %s", projectDir);
		}

		return projectName;
	}

	@exported("projectService")
	@performanceLog()
	public async createProject(projectOptions: IProjectSettings): Promise<ICreateProjectData> {
		const projectName = await this.validateProjectName({ projectName: projectOptions.projectName, force: projectOptions.force, pathToProject: projectOptions.pathToProject });
		const projectDir = this.getValidProjectDir(projectOptions.pathToProject, projectName);

		this.$fs.createDirectory(projectDir);

		const appId = projectOptions.appId || this.$projectHelper.generateDefaultAppId(projectName, constants.DEFAULT_APP_IDENTIFIER_PREFIX);
		this.createPackageJson(projectDir, appId);
		this.$logger.trace(`Creating a new NativeScript project with name ${projectName} and id ${appId} at location ${projectDir}`);

		const projectCreationData = await this.createProjectCore({ template: projectOptions.template, projectDir, ignoreScripts: projectOptions.ignoreScripts, appId: appId, projectName });

		this.$logger.info();
		this.$logger.printMarkdown("__Project `%s` was successfully created.__", projectName);

		return projectCreationData;
	}

	@exported("projectService")
	public isValidNativeScriptProject(pathToProject?: string): boolean {
		try {
			const projectData = this.$projectDataService.getProjectData(pathToProject);

			return !!projectData && !!projectData.projectDir && !!(projectData.projectIdentifiers.ios && projectData.projectIdentifiers.android);
		} catch (e) {
			return false;
		}
	}

	private getValidProjectDir(pathToProject: string, projectName: string): string {
		const selectedPath = path.resolve(pathToProject || ".");
		const projectDir = path.join(selectedPath, projectName);

		return projectDir;
	}

	private async createProjectCore(projectCreationSettings: IProjectCreationSettings): Promise<ICreateProjectData> {
		const { template, projectDir, appId, projectName, ignoreScripts } = projectCreationSettings;

		try {
			const templateData = await this.$projectTemplatesService.prepareTemplate(template, projectDir);
			const templatePackageJsonContent = templateData.templatePackageJsonContent;
			const templateVersion = templateData.templateVersion;

			await this.extractTemplate(projectDir, templateData);

			if (templateVersion === constants.TemplateVersions.v2) {
				this.alterPackageJsonData(projectDir, appId);
			}

			await this.ensureAppResourcesExist(projectDir);

			if (templateVersion === constants.TemplateVersions.v1) {
				this.mergeProjectAndTemplateProperties(projectDir, templatePackageJsonContent); // merging dependencies from template (dev && prod)
				this.removeMergedDependencies(projectDir, templatePackageJsonContent);
			}

			if (templateVersion === constants.TemplateVersions.v1) {
				await this.$packageManager.uninstall(templatePackageJsonContent.name, { save: true }, projectDir);
			}

			// Install devDependencies and execute all scripts:
			await this.$packageManager.install(projectDir, projectDir, {
				disableNpmInstall: false,
				frameworkPath: null,
				ignoreScripts
			});
		} catch (err) {
			this.$fs.deleteDirectory(projectDir);
			throw err;
		}

		await this.$hooksService.executeAfterHooks(Hooks.createProject, {
			hookArgs: projectCreationSettings
		});

		return { projectName, projectDir };
	}

	@performanceLog()
	private async extractTemplate(projectDir: string, templateData: ITemplateData): Promise<void> {
		this.$fs.ensureDirectoryExists(projectDir);

		switch (templateData.templateVersion) {
			case constants.TemplateVersions.v1:
				const projectData = this.$projectDataService.getProjectData(projectDir);
				const destinationDirectory = projectData.getAppDirectoryPath(projectDir);
				this.$fs.createDirectory(destinationDirectory);

				this.$logger.trace(`Copying application from '${templateData.templatePath}' into '${destinationDirectory}'.`);
				shelljs.cp('-R', path.join(templateData.templatePath, "*"), destinationDirectory);
				break;
			case constants.TemplateVersions.v2:
				const fullTemplateName = templateData.version ? `${templateData.templateName}@${templateData.version}` : templateData.templateName;
				await this.$pacoteService.extractPackage(fullTemplateName, projectDir);
				break;
			default:
				this.$errors.fail(format(constants.ProjectTemplateErrors.InvalidTemplateVersionStringFormat, templateData.templateName, templateData.templateVersion));
				break;
		}
	}

	@performanceLog()
	private async ensureAppResourcesExist(projectDir: string): Promise<void> {
		const projectData = this.$projectDataService.getProjectData(projectDir);
		const appResourcesDestinationPath = projectData.getAppResourcesDirectoryPath(projectDir);

		if (!this.$fs.exists(appResourcesDestinationPath)) {
			this.$fs.createDirectory(appResourcesDestinationPath);
			const tempDir = await this.$tempService.mkdirSync("ns-default-template");
			// the template installed doesn't have App_Resources -> get from a default template
			await this.$pacoteService.extractPackage(constants.RESERVED_TEMPLATE_NAMES["default"], tempDir);
			const templateProjectData = this.$projectDataService.getProjectData(tempDir);
			const templateAppResourcesDir = templateProjectData.getAppResourcesDirectoryPath(tempDir);
			this.$fs.copyFile(path.join(templateAppResourcesDir, "*"), appResourcesDestinationPath);
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
			this.$errors.fail(`Couldn't find package.json data in installed template`);
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

	@performanceLog()
	private alterPackageJsonData(projectDir: string, projectId: string): void {
		const projectFilePath = path.join(projectDir, this.$staticConfig.PROJECT_FILE_NAME);

		const packageJsonData = this.$fs.readJson(projectFilePath);

		// Remove the metadata keys from the package.json
		let updatedPackageJsonData = _.omitBy(packageJsonData, (value: any, key: string) => _.startsWith(key, "_") || TemplatesV2PackageJsonKeysToRemove.indexOf(key) !== -1);
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
injector.register("projectService", ProjectService);
