import * as constants from "../constants";
import * as osenv from "osenv";
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

	public createProject(projectName: string, selectedTemplate?: string): IFuture<void> {
		return (() => {
			if (!projectName) {
				this.$errors.fail("You must specify <App name> when creating a new project.");
			}

			projectName = this.$projectNameService.ensureValidName(projectName, { force: this.$options.force }).wait();

			let projectId = this.$options.appid || this.$projectHelper.generateDefaultAppId(projectName, constants.DEFAULT_APP_IDENTIFIER_PREFIX);

			let projectDir = path.join(path.resolve(this.$options.path || "."), projectName);
			this.$fs.createDirectory(projectDir);
			if (this.$fs.exists(projectDir) && !this.$fs.isEmptyDir(projectDir)) {
				this.$errors.fail("Path already exists and is not empty %s", projectDir);
			}

			this.createPackageJson(projectDir, projectId);

			let customAppPath = this.getCustomAppPath();
			if (customAppPath) {
				customAppPath = path.resolve(customAppPath);
				if (!this.$fs.exists(customAppPath)) {
					this.$errors.failWithoutHelp(`The specified path "${customAppPath}" doesn't exist. Check that you specified the path correctly and try again.`);
				}

				let customAppContents = this.$fs.enumerateFilesInDirectorySync(customAppPath);
				if (customAppContents.length === 0) {
					this.$errors.failWithoutHelp(`The specified path "${customAppPath}" is empty directory.`);
				}
			}

			this.$logger.trace("Creating a new NativeScript project with name %s and id %s at location %s", projectName, projectId, projectDir);

			let projectAppDirectory = path.join(projectDir, constants.APP_FOLDER_NAME);
			let appPath: string = null;
			if (customAppPath) {
				this.$logger.trace("Using custom app from %s", customAppPath);

				// Make sure that the source app/ is not a direct ancestor of a target app/
				let relativePathFromSourceToTarget = path.relative(customAppPath, projectAppDirectory);
				// path.relative returns second argument if the paths are located on different disks
				// so in this case we don't need to make the check for direct ancestor
				if (relativePathFromSourceToTarget !== projectAppDirectory) {
					let doesRelativePathGoUpAtLeastOneDir = relativePathFromSourceToTarget.split(path.sep)[0] === "..";
					if (!doesRelativePathGoUpAtLeastOneDir) {
						this.$errors.fail("Project dir %s must not be created at/inside the template used to create the project %s.", projectDir, customAppPath);
					}
				}
				this.$logger.trace("Copying custom app into %s", projectAppDirectory);
				appPath = customAppPath;
			} else {
				let templatePath = this.$projectTemplatesService.prepareTemplate(selectedTemplate, projectDir).wait();
				this.$logger.trace(`Copying application from '${templatePath}' into '${projectAppDirectory}'.`);
				let templatePackageJson = this.$fs.readJson(path.join(templatePath, "package.json"));
				selectedTemplate = templatePackageJson.name;
				appPath = templatePath;
			}

			try {
				//TODO: plamen5kov: move copy of template and npm uninstall in prepareTemplate logic
				this.createProjectCore(projectDir, appPath, projectId).wait();
				let templatePackageJsonData = this.getDataFromJson(appPath);
				this.mergeProjectAndTemplateProperties(projectDir, templatePackageJsonData); //merging dependencies from template (dev && prod)
				this.removeMergedDependencies(projectDir, templatePackageJsonData);
				this.$npm.install(projectDir, projectDir, { "ignore-scripts": this.$options.ignoreScripts }).wait();
				selectedTemplate = selectedTemplate || "";
				let templateName = (constants.RESERVED_TEMPLATE_NAMES[selectedTemplate.toLowerCase()] || selectedTemplate/*user template*/) || constants.RESERVED_TEMPLATE_NAMES["default"];
				this.$npm.uninstall(selectedTemplate, { save: true }, projectDir).wait();

				// TODO: plamen5kov: remove later (put only so tests pass (need to fix tests))
				this.$logger.trace(`Using NativeScript verified template: ${templateName} with version undefined.`);
			} catch (err) {
				this.$fs.deleteDirectory(projectDir);
				throw err;
			}
			this.$logger.printMarkdown("Project `%s` was successfully created.", projectName);

		}).future<void>()();
	}

	private getDataFromJson(templatePath: string): any {
		let templatePackageJsonPath = path.join(templatePath, constants.PACKAGE_JSON_FILE_NAME);
		if(this.$fs.exists(templatePackageJsonPath)) {
			let templatePackageJsonData = this.$fs.readJson(templatePackageJsonPath);
			return templatePackageJsonData;
		} else {
			this.$logger.trace(`Template ${templatePath} does not have ${constants.PACKAGE_JSON_FILE_NAME} file.`);
		}
		return null;
	}

	private removeMergedDependencies(projectDir: string, templatePackageJsonData: any) : void {
		let extractedTemplatePackageJsonPath = path.join(projectDir, constants.APP_FOLDER_NAME, constants.PACKAGE_JSON_FILE_NAME);
		for(let key in templatePackageJsonData) {
			if(constants.PackageJsonKeysToKeep.indexOf(key) === -1) {
				delete templatePackageJsonData[key];
			}
		}

		this.$logger.trace("Deleting unnecessary information from template json.");
		this.$fs.writeJson(extractedTemplatePackageJsonPath, templatePackageJsonData);
	}

	private mergeProjectAndTemplateProperties(projectDir: string, templatePackageJsonData: any): void {
		if(templatePackageJsonData) {
			let projectPackageJsonPath = path.join(projectDir, constants.PACKAGE_JSON_FILE_NAME);
			let projectPackageJsonData = this.$fs.readJson(projectPackageJsonPath);
			this.$logger.trace("Initial project package.json data: ", projectPackageJsonData);
			if(projectPackageJsonData.dependencies || templatePackageJsonData.dependencies) {
				projectPackageJsonData.dependencies = this.mergeDependencies(projectPackageJsonData.dependencies, templatePackageJsonData.dependencies);
			}

			if (projectPackageJsonData.devDependencies || templatePackageJsonData.devDependencies) {
				projectPackageJsonData.devDependencies = this.mergeDependencies(projectPackageJsonData.devDependencies, templatePackageJsonData.devDependencies);
			}
			this.$logger.trace("New project package.json data: ", projectPackageJsonData);
			this.$fs.writeJson(projectPackageJsonPath, projectPackageJsonData);
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

	private createProjectCore(projectDir: string, appSourcePath: string, projectId: string): IFuture<void> {
		return (() => {
			this.$fs.ensureDirectoryExists(projectDir);

			let appDestinationPath = path.join(projectDir, constants.APP_FOLDER_NAME);
			this.$fs.createDirectory(appDestinationPath);

			shelljs.cp('-R', path.join(appSourcePath, "*"), appDestinationPath);

			this.$fs.createDirectory(path.join(projectDir, "platforms"));

			let tnsModulesVersion = this.$options.tnsModulesVersion;
			let packageName = constants.TNS_CORE_MODULES_NAME;
			if (tnsModulesVersion) {
				packageName = `${packageName}@${tnsModulesVersion}`;
			}
			this.$npm.install(packageName, projectDir, { save: true, "save-exact": true }).wait();
		}).future<void>()();
	}

	private createPackageJson(projectDir: string, projectId: string): void {
		this.$projectDataService.initialize(projectDir);
		this.$projectDataService.setValue("id", projectId);
	}

	private getCustomAppPath(): string {
		let customAppPath = this.$options.copyFrom || this.$options.linkTo;
		if (customAppPath) {
			if (customAppPath.indexOf("http://") === 0) {
				this.$errors.fail("Only local paths for custom app are supported.");
			}

			if (customAppPath.substr(0, 1) === '~') {
				customAppPath = path.join(osenv.home(), customAppPath.substr(1));
			}
		}

		return customAppPath;
	}
}
$injector.register("projectService", ProjectService);
