import { EOL } from "os";
import * as path from "path";
import { TARGET_FRAMEWORK_IDENTIFIERS } from "../../constants";
import { cache } from "../../decorators";

export abstract class ProjectBase implements Project.IProjectBase {
	private static VALID_CONFIGURATION_CHARACTERS_REGEX = "[-_A-Za-z0-9]";
	private static CONFIGURATION_FROM_FILE_NAME_REGEX = new RegExp(`^[.](${ProjectBase.VALID_CONFIGURATION_CHARACTERS_REGEX}+?)[.]abproject$`, "i");
	private static ANDROID_MANIFEST_NAME = "AndroidManifest.xml";
	private static APP_IDENTIFIER_PLACEHOLDER = "$AppIdentifier$";

	public configurationSpecificData: IDictionary<Project.IData>;

	protected _shouldSaveProject = false;
	protected _projectData: Project.IData;

	private _hasBuildConfigurations = false;

	constructor(protected $cordovaProjectCapabilities: Project.ICapabilities,
		protected $errors: IErrors,
		protected $fs: IFileSystem,
		protected $logger: ILogger,
		protected $nativeScriptProjectCapabilities: Project.ICapabilities,
		protected $options: ICommonOptions,
		protected $projectConstants: Project.IConstants,
		protected $staticConfig: Config.IStaticConfig) {
		this.configurationSpecificData = Object.create(null);
	}

	// This property is purposely written as two separate methods so that only get/set can be overriden
	protected getShouldSaveProject(): boolean {
		return this._shouldSaveProject;
	}

	protected setShouldSaveProject(shouldSaveProject: boolean) {
		this._shouldSaveProject = shouldSaveProject;
	}

	public get projectData(): Project.IData {
		this.readProjectData();
		return this._projectData;
	}

	public set projectData(projectData: Project.IData) {
		this._projectData = projectData;
	}

	public projectDir: string;
	public getProjectDir(): string {
		return this.projectDir;
	}

	public get capabilities(): Project.ICapabilities {
		const projectData = this.projectData;
		if (projectData) {
			if (projectData.Framework && projectData.Framework.toLowerCase() === TARGET_FRAMEWORK_IDENTIFIERS.NativeScript.toLowerCase()) {
				return this.$nativeScriptProjectCapabilities;
			} else if (projectData.Framework && projectData.Framework.toLowerCase() === TARGET_FRAMEWORK_IDENTIFIERS.Cordova.toLowerCase()) {
				return this.$cordovaProjectCapabilities;
			}
		}

		return null;
	}

	public get hasBuildConfigurations(): boolean {
		return this._hasBuildConfigurations;
	}

	public get projectInformation(): Project.IProjectInformation {
		return {
			projectData: this.projectData,
			configurationSpecificData: this.configurationSpecificData,
			hasBuildConfigurations: this.hasBuildConfigurations,
			configurations: _.keys(this.configurationSpecificData)
		};
	}

	@cache()
	public getAppIdentifierForPlatform(platform?: string): string {
		let platformSpecificAppIdentifier = this.projectData.AppIdentifier;

		if (platform &&
			platform.toLowerCase() === this.$projectConstants.ANDROID_PLATFORM_NAME.toLowerCase() &&
			this.projectData.Framework === TARGET_FRAMEWORK_IDENTIFIERS.Cordova) {
			const pathToAndroidResources = path.join(this.projectDir, this.$staticConfig.APP_RESOURCES_DIR_NAME, this.$projectConstants.ANDROID_PLATFORM_NAME);

			const pathToAndroidManifest = path.join(pathToAndroidResources, ProjectBase.ANDROID_MANIFEST_NAME);
			const appIdentifierInAndroidManifest = this.getAppIdentifierFromConfigFile(pathToAndroidManifest, /package\s*=\s*"(\S*)"/);

			if (appIdentifierInAndroidManifest && appIdentifierInAndroidManifest !== ProjectBase.APP_IDENTIFIER_PLACEHOLDER) {
				platformSpecificAppIdentifier = appIdentifierInAndroidManifest;
			}
		}

		return platformSpecificAppIdentifier;
	}

	protected abstract validate(): void;
	protected abstract saveProjectIfNeeded(): void;

	protected readProjectData(): void {
		const projectDir = this.getProjectDir();
		this.setShouldSaveProject(false);
		if (projectDir) {
			const projectFilePath = path.join(projectDir, this.$projectConstants.PROJECT_FILE);
			try {
				this.projectData = this.getProjectData(projectFilePath);
				this.validate();

				_.each(this.$fs.enumerateFilesInDirectorySync(projectDir), (configProjectFile: string) => {
					const configMatch = path.basename(configProjectFile).match(ProjectBase.CONFIGURATION_FROM_FILE_NAME_REGEX);
					if (configMatch && configMatch.length > 1) {
						const configurationName = configMatch[1];
						const configProjectContent = this.$fs.readJson(configProjectFile),
							configurationLowerCase = configurationName.toLowerCase();
						this.configurationSpecificData[configurationLowerCase] = <any>_.merge(_.cloneDeep(this._projectData), configProjectContent);
						this._hasBuildConfigurations = true;
					}
				});
			} catch (err) {
				if (err.message === "FUTURE_PROJECT_VER") {
					this.$errors.failWithoutHelp("This project is created by a newer version of AppBuilder. Upgrade AppBuilder CLI to work with it.");
				}

				this.$errors.failWithoutHelp("The project file %s is corrupted." + EOL +
					"Consider restoring an earlier version from your source control or backup." + EOL +
					"To create a new one with the default settings, delete this file and run $ appbuilder init hybrid." + EOL +
					"Additional technical information: %s", projectFilePath, err.toString());
			}

			this.saveProjectIfNeeded();
		}
	}

	private getProjectData(projectFilePath: string): Project.IData {
		const data = this.$fs.readJson(projectFilePath);
		if (data.projectVersion && data.projectVersion.toString() !== "1") {
			this.$errors.fail("FUTURE_PROJECT_VER");
		}

		if (!_.has(data, "Framework")) {
			if (_.has(data, "projectType")) {
				data["Framework"] = data["projectType"];
				delete data["projectType"];
			} else {
				data["Framework"] = TARGET_FRAMEWORK_IDENTIFIERS.Cordova;
			}

			this.setShouldSaveProject(true);
		}

		return data;
	}

	private getAppIdentifierFromConfigFile(pathToConfigFile: string, regExp: RegExp): string {
		if (this.$fs.exists(pathToConfigFile)) {
			const fileContent = this.$fs.readText(pathToConfigFile);

			const matches = fileContent.match(regExp);

			if (matches && matches[1]) {
				return matches[1];
			}
		}

		return null;
	}
}
