import * as path from "path";
import * as shell from "shelljs";
import * as constants from "../constants";

export class AndroidResourcesMigrationService implements IAndroidResourcesMigrationService {
	private static ANDROID_DIR = "Android";
	private static ANDROID_DIR_TEMP = "Android-Updated";
	private static ANDROID_DIR_OLD = "Android-Pre-v4";

	constructor(private $fs: IFileSystem,
		private $logger: ILogger,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) { }

	public canMigrate(platformString: string): boolean {
		return platformString.toLowerCase() === this.$devicePlatformsConstants.Android.toLowerCase();
	}

	public hasMigrated(appResourcesDir: string): boolean {
		return this.$fs.exists(path.join(appResourcesDir, AndroidResourcesMigrationService.ANDROID_DIR, constants.SRC_DIR, constants.MAIN_DIR));
	}

	public async migrate(appResourcesDir: string): Promise<void> {
		const originalAppResources = path.join(appResourcesDir, AndroidResourcesMigrationService.ANDROID_DIR);
		const appResourcesDestination = path.join(appResourcesDir, AndroidResourcesMigrationService.ANDROID_DIR_TEMP);
		const appMainSourceSet = path.join(appResourcesDestination, constants.SRC_DIR, constants.MAIN_DIR);
		const appResourcesMainSourceSetResourcesDestination = path.join(appMainSourceSet, constants.RESOURCES_DIR);

		this.$fs.ensureDirectoryExists(appResourcesDestination);
		this.$fs.ensureDirectoryExists(appMainSourceSet);
		// create /java, /res and /assets in the App_Resources/Android/src/main directory
		this.$fs.ensureDirectoryExists(appResourcesMainSourceSetResourcesDestination);
		this.$fs.ensureDirectoryExists(path.join(appMainSourceSet, "java"));
		this.$fs.ensureDirectoryExists(path.join(appMainSourceSet, constants.ASSETS_DIR));

		const isDirectory = (source: string) => this.$fs.getLsStats(source).isDirectory();
		const getAllFiles = (source: string) => this.$fs.readDirectory(source).map(name => path.join(source, name));
		const getDirectories = (files: string[]) => files.filter(isDirectory);
		const getFiles = (files: string[]) => files.filter((file: string) => !isDirectory(file));

		this.$fs.copyFile(path.join(originalAppResources, constants.APP_GRADLE_FILE_NAME), path.join(appResourcesDestination, constants.APP_GRADLE_FILE_NAME));

		const appResourcesFiles = getAllFiles(originalAppResources);
		const resourceDirectories = getDirectories(appResourcesFiles);
		const resourceFiles = getFiles(appResourcesFiles);

		resourceDirectories.forEach(dir => {
			if (path.basename(dir) !== "libs") {
				// don't copy /App_Resources/Android/libs into the src/main/res/libs directory
				this.$fs.copyFile(dir, appResourcesMainSourceSetResourcesDestination);
			} else {
				// copy App_Resources/Android/libs to App_ResourcesNew/Android/libs
				this.$fs.copyFile(dir, path.join(appResourcesDestination));
			}
		});

		resourceFiles.forEach(file => {
			const fileName = path.basename(file);
			if (fileName !== constants.MANIFEST_FILE_NAME) {
				// don't copy AndroidManifest into /App_Resources/Android as it needs to be inside src/main/
				this.$fs.copyFile(file, path.join(appResourcesDestination, fileName));
			}
		});

		this.$fs.copyFile(path.join(originalAppResources, constants.MANIFEST_FILE_NAME), path.join(appMainSourceSet, constants.MANIFEST_FILE_NAME));

		// rename the legacy app_resources to ANDROID_DIR_OLD
		shell.mv(originalAppResources, path.join(appResourcesDir, AndroidResourcesMigrationService.ANDROID_DIR_OLD));
		// move the new, updated app_resources to App_Resources/Android, as  the de facto resources
		shell.mv(appResourcesDestination, originalAppResources);

		this.$logger.out(`Successfully updated your project's application resources '/Android' directory structure.\nThe previous version of your Android application resources has been renamed to '/${AndroidResourcesMigrationService.ANDROID_DIR_OLD}'`);
	}
}

$injector.register("androidResourcesMigrationService", AndroidResourcesMigrationService);
