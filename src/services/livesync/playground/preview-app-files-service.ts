import * as path from "path";
import { APP_FOLDER_NAME, TNS_MODULES_FOLDER_NAME, APP_RESOURCES_FOLDER_NAME } from "../../../constants";
import { PreviewSdkEventNames } from "./preview-app-constants";
import { FilePayload, FilesPayload } from "nativescript-preview-sdk";
import { IFileSystem, IProjectFilesManager, IProjectFilesProvider } from "../../../common/declarations";
import { IProjectDataService } from "../../../definitions/project";
import { IPlatformsDataService } from "../../../definitions/platform";
import * as _ from "lodash";

const isTextOrBinary = require('istextorbinary');

export class PreviewAppFilesService implements IPreviewAppFilesService {
	private excludedFileExtensions = [".ts", ".sass", ".scss", ".less"];
	private excludedFiles = [".DS_Store"];

	constructor(
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $platformsDataService: IPlatformsDataService,
		private $projectDataService: IProjectDataService,
		private $projectFilesManager: IProjectFilesManager,
		private $projectFilesProvider: IProjectFilesProvider
	) { }

	public getInitialFilesPayload(data: IPreviewAppLiveSyncData, platform: string, deviceId?: string): FilesPayload {
		const rootFilesDir = this.getRootFilesDir(data, platform);
		const filesToSync = this.$projectFilesManager.getProjectFiles(rootFilesDir);
		const payloads = this.getFilesPayload(data, { filesToSync }, platform, deviceId);
		return payloads;
	}

	public getFilesPayload(data: IPreviewAppLiveSyncData, filesData: IPreviewAppFilesData, platform: string, deviceId?: string): FilesPayload {
		const { filesToSync, filesToRemove } = filesData;

		const filesToTransfer = filesToSync
			.filter(file => file.indexOf(TNS_MODULES_FOLDER_NAME) === -1)
			.filter(file => file.indexOf(APP_RESOURCES_FOLDER_NAME) === -1)
			.filter(file => !_.includes(this.excludedFiles, path.basename(file)))
			.filter(file => !_.includes(this.excludedFileExtensions, path.extname(file)));

		this.$logger.trace(`Sending ${filesToTransfer.join("\n")}.`);

		const files = this.createFilePayloads(data, platform, filesToTransfer, filesToRemove);

		return {
			files,
			platform,
			hmrMode: data.useHotModuleReload ? 1 : 0,
			deviceId
		};
	}

	private createFilePayloads(data: IPreviewAppLiveSyncData, platform: string, filesToTransfer: string[], filesToRemove: string[]): FilePayload[] {
		const rootFilesDir = this.getRootFilesDir(data, platform);
		const payloadsToSync = _.filter(filesToTransfer, file => {
			const fileInfo = this.$projectFilesProvider.getProjectFileInfo(file, platform, {});
			return fileInfo && fileInfo.shouldIncludeFile;
		})
		.map(file => this.createFilePayload(file, platform, rootFilesDir, PreviewSdkEventNames.CHANGE_EVENT_NAME));
		const payloadsToRemove = _.map(filesToRemove, file => this.createFilePayload(file, platform, rootFilesDir, PreviewSdkEventNames.UNLINK_EVENT_NAME));
		const payloads = payloadsToSync.concat(payloadsToRemove);
		return payloads;
	}

	private createFilePayload(file: string, platform: string, rootFilesDir: string, event: string): FilePayload {
		let fileContents = "";
		let binary = false;

		if (event === PreviewSdkEventNames.CHANGE_EVENT_NAME) {
			binary = isTextOrBinary.isBinarySync(file);
			if (binary) {
				const bitmap = <string>this.$fs.readFile(file);
				const base64 = Buffer.from(bitmap).toString('base64');
				fileContents = base64;
			} else {
				fileContents = this.$fs.readText(file);
			}
		}

		const filePayload = {
			event,
			file: path.relative(rootFilesDir, file),
			binary,
			fileContents
		};

		return filePayload;
	}

	private getRootFilesDir(data: IPreviewAppLiveSyncData, platform: string): string {
		const projectData = this.$projectDataService.getProjectData(data.projectDir);
		const platformData = this.$platformsDataService.getPlatformData(platform, projectData);
		const rootFilesDir = path.join(platformData.appDestinationDirectoryPath, APP_FOLDER_NAME);

		return rootFilesDir;
	}
}
$injector.register("previewAppFilesService", PreviewAppFilesService);
