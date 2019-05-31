const sourcemap = require("source-map");
import * as path from "path";
const sourceMapConverter = require("convert-source-map");
import { ANDROID_DEVICE_APP_ROOT_TEMPLATE, APP_FOLDER_NAME, NODE_MODULES_FOLDER_NAME } from "../constants";
import * as util from "util";

interface IParsedMessage {
	filePath?: string;
	line?: number;
	column?: number;
	message: string;
}

interface IFileLocation {
	line: number;
	column: number;
	sourceFile: string;
}

export class LogSourceMapService implements Mobile.ILogSourceMapService {
	private static FILE_PREFIX = "file:///";
	private getProjectData: Function;
	constructor(
		private $fs: IFileSystem,
		private $projectDataService: IProjectDataService,
		private $injector: IInjector,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) {
			this.getProjectData = _.memoize(this.$projectDataService.getProjectData.bind(this.$projectDataService));
	}

	public replaceWithOriginalFileLocations(platform: string, messageData: string, loggingOptions: Mobile.IDeviceLogOptions): string {
		if (!messageData || !loggingOptions.projectDir) {
			return messageData;
		}

		const projectData = this.getProjectData(loggingOptions.projectDir);
		const lines = messageData.split("\n");
		const isAndroid = platform.toLowerCase() === this.$devicePlatformsConstants.Android.toLowerCase();
		const parserFunction = isAndroid ? this.parseAndroidLog.bind(this, projectData) : this.parseIosLog.bind(this);
		let outputData = "";

		lines.forEach(rawLine => {
			const parsedLine = parserFunction(rawLine);
			const originalLocation = this.getOriginalFileLocation(platform, parsedLine, projectData);

			if (originalLocation && originalLocation.sourceFile) {
				const {sourceFile, line, column} = originalLocation;
				outputData = `${outputData}${parsedLine.message} ${LogSourceMapService.FILE_PREFIX}${sourceFile}:${line}:${column}\n`;
			} else if (rawLine !== "") {
				outputData = `${outputData}${rawLine}\n`;
			}
		});

		return outputData;
	}

	private getOriginalFileLocation(platform: string, parsedLine: IParsedMessage, projectData: IProjectData): IFileLocation {
		const fileLoaction = path.join(this.getFilesLocation(platform, projectData), APP_FOLDER_NAME);

		if (parsedLine && parsedLine.filePath) {
			const sourceMapFile = path.join(fileLoaction, parsedLine.filePath);
			if (this.$fs.exists(sourceMapFile)) {
				const source = this.$fs.readText(sourceMapFile);
				const sourceMapRaw = sourceMapConverter.fromSource(source);
				if (sourceMapRaw && sourceMapRaw.sourcemap) {
					const sourceMap = sourceMapRaw.sourcemap;
					const smc = new sourcemap.SourceMapConsumer(sourceMap);
					const originalPosition = smc.originalPositionFor({ line: parsedLine.line, column: parsedLine.column });
					let sourceFile = originalPosition.source && originalPosition.source.replace("webpack:///", "");
					if (sourceFile) {
						if (!_.startsWith(sourceFile, NODE_MODULES_FOLDER_NAME)) {
							sourceFile = path.join(projectData.getAppDirectoryRelativePath(), sourceFile);
						}

						return { sourceFile, line: originalPosition.line, column: originalPosition.column};
					}
				}
			}
		}
	}

	private parseAndroidLog(projectData: IProjectData, rawMessage: string): IParsedMessage {
		// "JS: at module.exports.push../main-view-model.ts.HelloWorldModel.onTap (file:///data/data/org.nativescript.sourceMap/files/app/bundle.js:303:17)"
		// "System.err: File: "file:///data/data/org.nativescript.sourceMap/files/app/bundle.js, line: 304, column: 8"
		const fileIndex = rawMessage.lastIndexOf(LogSourceMapService.FILE_PREFIX);
		const deviceProjectPath = util.format(ANDROID_DEVICE_APP_ROOT_TEMPLATE, projectData.projectIdentifiers.android);
		let message = rawMessage;
		let parts, filePath, line, column;

		if (fileIndex >= 0) {
			const fileSubstring = rawMessage.substring(fileIndex + LogSourceMapService.FILE_PREFIX.length);
			//"data/data/org.nativescript.sourceMap/files/app/bundle.js, line: 304, column: 8"
			parts = fileSubstring.split(",");
			if (parts.length >= 3) {
				// "data/data/org.nativescript.sourceMap/files/app/bundle.js"
				parts[0] = parts[0].replace("'", "");
				// " line: 304"
				parts[1] = parts[1].replace(" line: ", "");
				// " column: 8"
				parts[2] = parts[2].replace(" column: ", "");
			} else {
				// "data/data/org.nativescript.sourceMap/files/app/bundle.js:303:17)"
				parts = fileSubstring.split(":");
			}

			if (parts.length >= 3) {
				// "/data/data/org.nativescript.sourceMap/files/app/"
				const devicePath = `${deviceProjectPath}/${APP_FOLDER_NAME}/`;
				// "bundle.js"
				filePath =  path.relative(devicePath, `${"/"}${parts[0]}`);
				line = parseInt(parts[1]);
				column = parseInt(parts[2]);
				message = rawMessage.substring(0, fileIndex);
				for (let i = 3; i < parts.length; i++) {
					message += parts[i];
				}
				// "JS: at module.exports.push../main-view-model.ts.HelloWorldModel.onTap ("
				message = _.trimEnd(message, "(");
				message = message.trim();
			}
		}

		return { filePath, line, column, message };
	}

	private parseIosLog(rawMessage: string): IParsedMessage {
		// "CONSOLE INFO file:///app/vendor.js:131:36: HMR: Hot Module Replacement Enabled. Waiting for signal."
		const fileIndex = rawMessage.lastIndexOf(LogSourceMapService.FILE_PREFIX);
		let message = rawMessage;
		let parts, filePath, line, column;

		if (fileIndex >= 0) {
			// "app/vendor.js:131:36: HMR: Hot Module Replacement Enabled. Waiting for signal."
			const fileSubstring = rawMessage.substring(fileIndex + LogSourceMapService.FILE_PREFIX.length);
			parts = fileSubstring.split(":");

			if (parts && parts.length >= 3) {
				filePath =  parts[0];
				// "app/vendor.js"
				if (_.startsWith(filePath, APP_FOLDER_NAME)) {
					filePath = path.relative(APP_FOLDER_NAME , parts[0]);
				}
				line = parseInt(parts[1]);
				column = parseInt(parts[2]);

				message = rawMessage.substring(0, fileIndex).trim();
				for (let i = 3; i < parts.length; i++) {
					message += parts[i];
				}
				message = message.trim();
			}
		}

		return { filePath, line, column, message };
	}

	private getFilesLocation(platform: string, projectData: IProjectData): string {
		try {
			const platformsData = this.$injector.resolve("platformsDataService").getPlatformData(platform.toLowerCase(), projectData);
			return platformsData.appDestinationDirectoryPath;
		} catch (err) {
			return "";
		}
	}
}

$injector.register("logSourceMapService", LogSourceMapService);
