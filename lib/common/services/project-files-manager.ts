import minimatch = require("minimatch");
import * as path from "path";
import * as util from "util";

export class ProjectFilesManager implements IProjectFilesManager {
	constructor(private $fs: IFileSystem,
		private $localToDevicePathDataFactory: Mobile.ILocalToDevicePathDataFactory,
		private $logger: ILogger,
		private $projectFilesProvider: IProjectFilesProvider) { }

	public getProjectFiles(projectFilesPath: string, excludedProjectDirsAndFiles?: string[], filter?: (filePath: string, stat: IFsStats) => boolean, opts?: any): string[] {
		const projectFiles = this.$fs.enumerateFilesInDirectorySync(projectFilesPath, (filePath, stat) => {
			const isFileExcluded = this.isFileExcluded(path.relative(projectFilesPath, filePath), excludedProjectDirsAndFiles);
			const isFileFiltered = filter ? filter(filePath, stat) : false;
			return !isFileExcluded && !isFileFiltered;
		}, opts);

		this.$logger.trace("enumerateProjectFiles: %s", util.inspect(projectFiles));

		return projectFiles;
	}

	public isFileExcluded(filePath: string, excludedProjectDirsAndFiles?: string[]): boolean {
		const isInExcludedList = !!_.find(excludedProjectDirsAndFiles, (pattern) => minimatch(filePath, pattern, { nocase: true }));
		return isInExcludedList || this.$projectFilesProvider.isFileExcluded(filePath);
	}

	public async createLocalToDevicePaths(deviceAppData: Mobile.IDeviceAppData, projectFilesPath: string, files: string[], excludedProjectDirsAndFiles: string[], projectFilesConfig?: IProjectFilesConfig): Promise<Mobile.ILocalToDevicePathData[]> {
		const deviceProjectRootPath = await deviceAppData.getDeviceProjectRootPath();

		files = files || this.getProjectFiles(projectFilesPath, excludedProjectDirsAndFiles, null, { enumerateDirectories: true });
		const localToDevicePaths = Promise.all(files
			.map(projectFile => this.$projectFilesProvider.getProjectFileInfo(projectFile, deviceAppData.platform, projectFilesConfig))
			.filter(projectFileInfo => projectFileInfo.shouldIncludeFile)
			.map(async projectFileInfo => this.$localToDevicePathDataFactory.create(projectFileInfo.filePath, projectFilesPath, projectFileInfo.onDeviceFileName, deviceProjectRootPath)));

		return localToDevicePaths;
	}

	public processPlatformSpecificFiles(directoryPath: string, platform: string, projectFilesConfig: IProjectFilesConfig, excludedDirs?: string[]): void {
		const contents = this.$fs.readDirectory(directoryPath);
		const files: string[] = [];

		_.each(contents, fileName => {
			const filePath = path.join(directoryPath, fileName);
			const fsStat = this.$fs.getFsStats(filePath);
			if (fsStat.isDirectory() && !_.includes(excludedDirs, fileName)) {
				this.processPlatformSpecificFilesCore(platform, this.$fs.enumerateFilesInDirectorySync(filePath), projectFilesConfig);
			} else if (fsStat.isFile()) {
				files.push(filePath);
			}
		});

		this.processPlatformSpecificFilesCore(platform, files, projectFilesConfig);
	}

	private processPlatformSpecificFilesCore(platform: string, files: string[],  projectFilesConfig: IProjectFilesConfig): void {
		// Renames the files that have `platform` as substring and removes the files from other platform
		_.each(files, filePath => {
			const projectFileInfo = this.$projectFilesProvider.getProjectFileInfo(filePath, platform,  projectFilesConfig);
			if (!projectFileInfo.shouldIncludeFile) {
				this.$fs.deleteFile(filePath);
			} else if (projectFileInfo.onDeviceFileName) {
				const onDeviceFilePath = path.join(path.dirname(filePath), projectFileInfo.onDeviceFileName);

				// Fix .js.map entries
				const extension = path.extname(projectFileInfo.onDeviceFileName);
				if (onDeviceFilePath !== filePath) {
					if (extension === ".js" || extension === ".map") {
						const oldName = extension === ".map" ? this.getFileName(filePath, extension) : path.basename(filePath);
						const newName = extension === ".map" ? this.getFileName(projectFileInfo.onDeviceFileName, extension) : path.basename(projectFileInfo.onDeviceFileName);

						let fileContent = this.$fs.readText(filePath);
						fileContent = fileContent.replace(new RegExp(oldName, 'g'), newName);
						this.$fs.writeFile(filePath, fileContent);
					}
					// Rename the file
					// this.$fs.rename is not called as it is error prone on some systems with slower hard drives and rigorous antivirus software
					this.$fs.writeFile(onDeviceFilePath, this.$fs.readText(filePath));
					this.$fs.deleteFile(filePath);
				}
			}
		});
	}

	private getFileName(filePath: string, extension: string): string {
		return path.basename(filePath.replace(extension === ".map" ? ".js.map" : ".js", ""));
	}
}
$injector.register("projectFilesManager", ProjectFilesManager);
