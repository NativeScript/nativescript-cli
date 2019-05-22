const sourcemap = require("source-map");
import * as path from "path";
const sourceMapConverter = require("convert-source-map");
import { ANDROID_DEVICE_APP_ROOT_TEMPLATE, APP_FOLDER_NAME, NODE_MODULES_FOLDER_NAME } from "../constants";
import * as util from "util"

interface IParsedMessage {
    filePath?: string,
    line?: number,
    column?: number,
    message: string
}

interface IFileLocation {
    line: number,
    column: number,
    sourceFile: string
}

export class LogSourceMapService {
    private static FILE_PREFIX = "file:///";
    constructor(
        private $fs: IFileSystem,
        private $projectDataService: IProjectDataService,
        private $injector: IInjector,
        private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants) {
    }
    
    public replaceWithOriginalFileLocations(platform: string, messageData: string): string {
        if (!messageData) {
            return messageData;
        }

        const lines = messageData.split("\n");
        const isAndroid = platform.toLowerCase() === this.$devicePlatformsConstants.Android.toLowerCase();
        const parserFunction = isAndroid ? this.parseAndroidLog.bind(this) : this.parseIosLog.bind(this);
        let outputData = "";

        lines.forEach(rawLine => {
            const parsedLine = parserFunction(rawLine);
            const originalLocation = this.getOriginalFileLocation(platform, parsedLine);

            if (originalLocation && originalLocation.sourceFile) {
                const {sourceFile, line, column} = originalLocation;
                outputData = `${outputData}${parsedLine.message} ${LogSourceMapService.FILE_PREFIX}${sourceFile}:${line}:${column}\n`
            } else if (rawLine !== "") {
                outputData = `${outputData}${rawLine}\n`
            }
        });

        return outputData;
    }

    private getOriginalFileLocation(platform: string, parsedLine: IParsedMessage): IFileLocation {
        const fileLoaction = path.join(this.getFilesLocation(platform), APP_FOLDER_NAME);

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
                            sourceFile = path.join(APP_FOLDER_NAME, sourceFile);
                        }

                        return { sourceFile, line: originalPosition.line, column: originalPosition.column};
                    }
                }
            }
        }
    }

    private parseAndroidLog(rawMessage: string): IParsedMessage {
        const fileIndex = rawMessage.lastIndexOf(LogSourceMapService.FILE_PREFIX);
        const projectData = this.$projectDataService.getProjectData();
        const deviceProjectPath = util.format(ANDROID_DEVICE_APP_ROOT_TEMPLATE, projectData.projectIdentifiers.android);
        let message = rawMessage;
        let parts, filePath, line, column;
        

        if (fileIndex >= 0) {
            const fileSubstring = rawMessage.substring(fileIndex + LogSourceMapService.FILE_PREFIX.length);
            parts = fileSubstring.split(",");
            if (parts.length >= 3) {
                parts[0] = parts[0].replace("'", "");
                parts[1] = parts[1].replace(" line: ", "");
                parts[2] = parts[2].replace(" column: ", "");
            } else {
                parts = fileSubstring.split(":");
            }

            if (parts.length >= 3) {
                const devicePath = `${deviceProjectPath}/${APP_FOLDER_NAME}/`;
                filePath =  path.relative(devicePath, parts[0]);
                line = parseInt(parts[1]);
                column = parseInt(parts[2]);
                message = rawMessage.substring(0, fileIndex);
                for (let i = 3; i < parts.length; i++) {
                    message += parts[i];
                }
                message = _.trimEnd(message, "(");
            }
        }

        return { filePath, line, column, message }
    }

    private parseIosLog(rawMessage: string): IParsedMessage {
        const fileIndex = rawMessage.lastIndexOf(LogSourceMapService.FILE_PREFIX);
        let message = rawMessage;
        let parts, filePath, line, column;



        if (fileIndex >= 0) {
            const fileSubstring = rawMessage.substring(fileIndex + LogSourceMapService.FILE_PREFIX.length);
            parts = fileSubstring.split(":");

            if (parts && parts.length >= 3) {
                filePath =  parts[0];
                if (_.startsWith(filePath, APP_FOLDER_NAME)) {
                    filePath = path.relative(APP_FOLDER_NAME ,parts[0]);
                }
                line = parseInt(parts[1]);
                column = parseInt(parts[2]);

                message = rawMessage.substring(0, fileIndex).trim();
                for (let i = 3; i < parts.length; i++) {
                    message += parts[i];
                }
            }
        }

        return { filePath, line, column, message }
    }

    private getFilesLocation(platform: string): string {
        try {
            const projectData = this.$projectDataService.getProjectData();
            const platformsData = this.$injector.resolve("platformsData").getPlatformData(platform.toLowerCase(), projectData);
            return platformsData.appDestinationDirectoryPath;
        } catch (err) {
            return null;
        }
    }
}

$injector.register("logSourceMapService", LogSourceMapService);
