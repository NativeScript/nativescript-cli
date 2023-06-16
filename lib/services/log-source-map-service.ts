import * as path from "path";
import * as util from "util";
import * as _ from "lodash";
import * as sourcemap from "source-map";
import * as sourceMapConverter from "convert-source-map";
import * as semver from "semver";
import { stringReplaceAll } from "../common/helpers";
import {
	ANDROID_DEVICE_APP_ROOT_TEMPLATE,
	APP_FOLDER_NAME,
	NODE_MODULES_FOLDER_NAME,
	PlatformTypes,
} from "../constants";
import { IProjectData, IProjectDataService } from "../definitions/project";
import { IPlatformsDataService } from "../definitions/platform";
import {
	IDictionary,
	IStringDictionary,
	IFileSystem,
} from "../common/declarations";
import { IInjector } from "../common/definitions/yok";
import { injector } from "../common/yok";

interface IParsedMessage {
	filePath?: string;
	line?: number;
	column?: number;
	messagePrefix: string;
	messageSuffix: string;
}

interface IFileLocation {
	line: number;
	column: number;
	sourceFile: string;
}

export class LogSourceMapService implements Mobile.ILogSourceMapService {
	private static FILE_PREFIX = "file:///";
	private static FILE_PREFIX_REPLACEMENT = "file: ";
	private static MEMOIZE_FUNCTION_RANDOM_KEY_FOR_JOIN = "__some_random_value__";
	private getProjectData: (projectDir: string) => IProjectData;
	private getRuntimeVersion: (projectDir: string, platform: string) => string;
	private cache: IDictionary<sourcemap.SourceMapConsumer> = {};
	private originalFilesLocationCache: IStringDictionary = {};

	private get $platformsDataService(): IPlatformsDataService {
		return this.$injector.resolve<IPlatformsDataService>(
			"platformsDataService"
		);
	}
	constructor(
		private $fs: IFileSystem,
		private $projectDataService: IProjectDataService,
		private $injector: IInjector,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $logger: ILogger
	) {
		this.getProjectData = _.memoize(
			this.$projectDataService.getProjectData.bind(this.$projectDataService)
		);
		this.getRuntimeVersion = _.memoize(this.getRuntimeVersionCore, (...args) =>
			args.join(LogSourceMapService.MEMOIZE_FUNCTION_RANDOM_KEY_FOR_JOIN)
		);
	}

	public async setSourceMapConsumerForFile(filePath: string): Promise<void> {
		try {
			if (!this.$fs.getFsStats(filePath).isDirectory()) {
				const mapFile = filePath + ".map";
				let sourceMapRaw;
				const source = this.$fs.readText(filePath);
				if (this.$fs.exists(mapFile)) {
					sourceMapRaw = sourceMapConverter.fromMapFileSource(
						source,
						(filename) => {
							return this.$fs.readText(
								path.join(path.dirname(filePath), filename)
							);
						}
					);
				} else {
					sourceMapRaw = sourceMapConverter.fromSource(source);
				}
				let smc: any = null;
				if (sourceMapRaw && sourceMapRaw.sourcemap) {
					const sourceMap = sourceMapRaw.sourcemap;
					smc = await sourcemap.SourceMapConsumer.with(sourceMap, null, (c) => {
						return c;
					});
				}

				this.cache[filePath] = smc;
			}
		} catch (err) {
			this.$logger.trace(
				`Unable to set sourceMapConsumer for file ${filePath}. Error is: ${err}`
			);
		}
	}

	public replaceWithOriginalFileLocations(
		platform: string,
		messageData: string,
		loggingOptions: Mobile.IDeviceLogOptions
	): string {
		if (!messageData || !loggingOptions || !loggingOptions.projectDir) {
			return messageData;
		}

		const projectData = this.getProjectData(loggingOptions.projectDir);
		const lines = messageData.split("\n");
		const isAndroid =
			platform.toLowerCase() ===
			this.$devicePlatformsConstants.Android.toLowerCase();
		const parserFunction = isAndroid
			? this.parseAndroidLog.bind(this, projectData)
			: this.parseIosLog.bind(this);
		let outputData = "";

		lines.forEach((rawLine) => {
			const parsedLine = parserFunction(rawLine);
			const originalLocation = this.getOriginalFileLocation(
				platform,
				parsedLine,
				projectData
			);

			if (originalLocation && originalLocation.sourceFile) {
				const runtimeVersion = this.getRuntimeVersion(
					loggingOptions.projectDir,
					platform
				);
				const { sourceFile, line, column } = originalLocation;
				if (
					semver.valid(runtimeVersion) &&
					semver.gte(semver.coerce(runtimeVersion), "6.1.0")
				) {
					const lastIndexOfFile = rawLine.lastIndexOf(
						LogSourceMapService.FILE_PREFIX
					);
					const firstPart = rawLine.substr(0, lastIndexOfFile);

					outputData +=
						firstPart +
						rawLine
							.substring(lastIndexOfFile)
							.replace(
								/file:\/\/\/.+?:\d+:\d+/,
								`${LogSourceMapService.FILE_PREFIX_REPLACEMENT}${sourceFile}:${line}:${column}`
							) +
						"\n";
				} else {
					outputData = `${outputData}${parsedLine.messagePrefix}${LogSourceMapService.FILE_PREFIX_REPLACEMENT}${sourceFile}:${line}:${column}${parsedLine.messageSuffix}\n`;
				}
			} else if (rawLine !== "") {
				outputData = `${outputData}${rawLine}\n`;
			}
		});

		return outputData;
	}

	private getRuntimeVersionCore(projectDir: string, platform: string): string {
		let runtimeVersion: string = null;
		try {
			const projectData = this.getProjectData(projectDir);
			const platformData = this.$platformsDataService.getPlatformData(
				platform,
				projectData
			);
			const runtimeVersionData = this.$projectDataService.getRuntimePackage(
				projectData.projectDir,
				<PlatformTypes>platformData.platformNameLowerCase
			);
			runtimeVersion = runtimeVersionData && runtimeVersionData.version;
		} catch (err) {
			this.$logger.trace(
				`Unable to get runtime version for project directory: ${projectDir} and platform ${platform}. Error is: `,
				err
			);
		}

		return runtimeVersion;
	}

	private getOriginalFileLocation(
		platform: string,
		parsedLine: IParsedMessage,
		projectData: IProjectData
	): IFileLocation {
		const fileLocation = path.join(
			this.getFilesLocation(platform, projectData),
			APP_FOLDER_NAME
		);

		if (parsedLine && parsedLine.filePath) {
			const sourceMapFile = path.join(fileLocation, parsedLine.filePath);
			const smc = this.cache[sourceMapFile];
			if (smc) {
				const originalPosition = smc.originalPositionFor({
					line: parsedLine.line,
					column: parsedLine.column,
				});
				let sourceFile =
					originalPosition.source &&
					originalPosition.source.replace("webpack:///", "");
				if (sourceFile) {
					const appPath = projectData.getAppDirectoryRelativePath();
					if (
						!_.startsWith(sourceFile, NODE_MODULES_FOLDER_NAME) &&
						!_.startsWith(sourceFile, appPath + "/")
					) {
						sourceFile = path.join(appPath, sourceFile);
					}

					sourceFile = stringReplaceAll(sourceFile, "/", path.sep);
					if (!this.originalFilesLocationCache[sourceFile]) {
						const { dir, ext, name } = path.parse(sourceFile);
						const platformSpecificName = `${name}.${platform.toLowerCase()}`;
						const platformSpecificFile = path.format({
							dir,
							ext,
							name: platformSpecificName,
						});
						if (
							this.$fs.exists(
								path.join(projectData.projectDir, platformSpecificFile)
							)
						) {
							this.originalFilesLocationCache[sourceFile] =
								platformSpecificFile;
						} else {
							this.originalFilesLocationCache[sourceFile] = sourceFile;
						}
					}

					return {
						sourceFile: this.originalFilesLocationCache[sourceFile],
						line: originalPosition.line,
						column: originalPosition.column,
					};
				}
			}
		}
	}

	private parseAndroidLog(
		projectData: IProjectData,
		rawMessage: string
	): IParsedMessage {
		// "JS: at module.exports.push../main-view-model.ts.HelloWorldModel.onTap (file:///data/data/org.nativescript.sourceMap/files/app/bundle.js:303:17)"
		// "System.err: File: "file:///data/data/org.nativescript.sourceMap/files/app/bundle.js, line: 304, column: 8"
		const fileIndex = rawMessage.lastIndexOf(LogSourceMapService.FILE_PREFIX);
		const deviceProjectPath = util.format(
			ANDROID_DEVICE_APP_ROOT_TEMPLATE,
			projectData.projectIdentifiers.android
		);
		let separator = ",";
		let messageSuffix = "";
		let parts, filePath, line, column, messagePrefix;

		if (fileIndex >= 0) {
			const fileSubstring = rawMessage.substring(
				fileIndex + LogSourceMapService.FILE_PREFIX.length
			);
			//"data/data/org.nativescript.sourceMap/files/app/bundle.js, line: 304, column: 8"
			parts = fileSubstring.split(separator);
			if (parts.length >= 3) {
				// "data/data/org.nativescript.sourceMap/files/app/bundle.js"
				parts[0] = parts[0].replace("'", "");
				// " line: 304"
				parts[1] = parts[1].replace(" line: ", "");
				// " column: 8"
				parts[2] = parts[2].replace(" column: ", "");
			} else {
				// "data/data/org.nativescript.sourceMap/files/app/bundle.js:303:17)"
				separator = ":";
				parts = fileSubstring.split(separator);
			}

			if (parts.length >= 3) {
				// "/data/data/org.nativescript.sourceMap/files/app/"
				const devicePath = `${deviceProjectPath}/${APP_FOLDER_NAME}/`;
				// "bundle.js"
				filePath = path.relative(devicePath, `${"/"}${parts[0]}`);
				line = parseInt(parts[1]);
				column = parseInt(parts[2]);
				messagePrefix = rawMessage.substring(0, fileIndex);
				for (let i = 3; i < parts.length; i++) {
					messageSuffix += `${parts[i]}${
						i === parts.length - 1 ? "" : separator
					}`;
				}
				// "JS: at module.exports.push../main-view-model.ts.HelloWorldModel.onTap ("
				messagePrefix = _.trimEnd(messagePrefix, "(");
			}
		}

		return { filePath, line, column, messagePrefix, messageSuffix };
	}

	private parseIosLog(rawMessage: string): IParsedMessage {
		// "CONSOLE INFO file:///app/vendor.js:131:36: HMR: Hot Module Replacement Enabled. Waiting for signal."
		const fileIndex = rawMessage.lastIndexOf(LogSourceMapService.FILE_PREFIX);
		let messageSuffix = "";
		let parts, filePath, line, column, messagePrefix;

		if (fileIndex >= 0) {
			// "app/vendor.js:131:36: HMR: Hot Module Replacement Enabled. Waiting for signal."
			const fileSubstring = rawMessage.substring(
				fileIndex + LogSourceMapService.FILE_PREFIX.length
			);
			parts = fileSubstring.split(":");

			if (parts && parts.length >= 3) {
				filePath = parts[0];
				// "app/vendor.js"
				if (_.startsWith(filePath, APP_FOLDER_NAME)) {
					filePath = path.relative(APP_FOLDER_NAME, parts[0]);
				}
				line = parseInt(parts[1]);
				column = parseInt(parts[2]);

				messagePrefix = rawMessage.substring(0, fileIndex);
				for (let i = 3; i < parts.length; i++) {
					messageSuffix += `${parts[i]}${i === parts.length - 1 ? "" : ":"}`;
				}
			}
		}

		return { filePath, line, column, messagePrefix, messageSuffix };
	}

	private getFilesLocation(
		platform: string,
		projectData: IProjectData
	): string {
		try {
			const platformsData = this.$platformsDataService.getPlatformData(
				platform.toLowerCase(),
				projectData
			);
			return platformsData.appDestinationDirectoryPath;
		} catch (err) {
			return "";
		}
	}
}

injector.register("logSourceMapService", LogSourceMapService);
