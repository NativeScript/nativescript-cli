import * as path from "path";
import * as minimatch from "minimatch";
import * as constants from "../constants";
import * as fs from "fs";

export class AppFilesUpdater {
	constructor(private appSourceDirectoryPath: string,
		private appDestinationDirectoryPath: string,
		public options: IAppFilesUpdaterOptions,
		public fs: IFileSystem
	) {
	}

	public updateApp(updateAppOptions: IUpdateAppOptions, projectData: IProjectData): void {
		this.cleanDestinationApp(updateAppOptions);
		const sourceFiles = updateAppOptions.filesToSync || this.resolveAppSourceFiles(projectData);

		updateAppOptions.beforeCopyAction(sourceFiles);
		this.copyAppSourceFiles(sourceFiles);
	}

	public cleanDestinationApp(updateAppOptions?: IUpdateAppOptions): void {
		let itemsToRemove: string[];

		if (updateAppOptions && updateAppOptions.filesToRemove) {
			// We get here during LiveSync - we only want to get rid of files, that the file system watcher detected were deleted
			itemsToRemove = updateAppOptions.filesToRemove.map(fileToRemove => path.relative(this.appSourceDirectoryPath, fileToRemove));
		} else {
			// We get here during the initial sync before the file system watcher is even started
			// delete everything and prepare everything anew just to be sure
			// Delete the destination app in order to prevent EEXIST errors when symlinks are used.
			itemsToRemove = this.readDestinationDir();
			itemsToRemove = itemsToRemove.filter(
				(directoryName: string) => directoryName !== constants.TNS_MODULES_FOLDER_NAME);

		}

		_(itemsToRemove).each((directoryItem: string) => {
			this.deleteDestinationItem(directoryItem);
		});
	}

	protected readDestinationDir(): string[] {
		if (this.fs.exists(this.appDestinationDirectoryPath)) {
			return this.fs.readDirectory(this.appDestinationDirectoryPath);
		} else {
			return [];
		}
	}

	protected deleteDestinationItem(directoryItem: string): void {
		this.fs.deleteDirectory(path.join(this.appDestinationDirectoryPath, directoryItem));
	}

	protected readSourceDir(projectData: IProjectData): string[] {
		const tnsDir = path.join(this.appSourceDirectoryPath, constants.TNS_MODULES_FOLDER_NAME);

		return this.fs.enumerateFilesInDirectorySync(this.appSourceDirectoryPath, null, { includeEmptyDirectories: true }).filter(dirName => dirName !== tnsDir);
	}

	protected resolveAppSourceFiles(projectData: IProjectData): string[] {
		if (this.options.bundle) {
			return [];
		}

		// Copy all files from app dir, but make sure to exclude tns_modules and application resources
		let sourceFiles = this.readSourceDir(projectData);

		if (this.options.release) {
			const testsFolderPath = path.join(this.appSourceDirectoryPath, 'tests');
			sourceFiles = sourceFiles.filter(source => source.indexOf(testsFolderPath) === -1);
		}

		// Remove .ts and .js.map files in release
		if (this.options.release) {
			constants.LIVESYNC_EXCLUDED_FILE_PATTERNS.forEach(pattern => sourceFiles = sourceFiles.filter(file => !minimatch(file, pattern, { nocase: true })));
		}

		// exclude the app_resources directory from being enumerated
		// for copying if it is present in the application sources dir
		const appResourcesPath = projectData.appResourcesDirectoryPath;
		sourceFiles = sourceFiles.filter(dirName => !path.normalize(dirName).startsWith(path.normalize(appResourcesPath)));

		return sourceFiles;
	}

	protected copyAppSourceFiles(sourceFiles: string[]): void {
		sourceFiles.map(source => {
			const destinationPath = path.join(this.appDestinationDirectoryPath, path.relative(this.appSourceDirectoryPath, source));

			let exists = fs.lstatSync(source);
			if (exists.isSymbolicLink()) {
				source = fs.realpathSync(source);
				exists = fs.lstatSync(source);
			}
			if (exists.isDirectory()) {
				return this.fs.createDirectory(destinationPath);
			}

			return this.fs.copyFile(source, destinationPath);
		});
	}
}
