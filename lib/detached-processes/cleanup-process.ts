// NOTE: This file is used to clean up resources used by CLI, when the CLI is killed.
// The instances here are not shared with the ones in main CLI process.
import * as fs from "fs";
import * as path from "path";
import * as shelljs from "shelljs";
import { FileLogService } from "./file-log-service";

const pathToBootstrap = process.argv[2];
if (!pathToBootstrap || !fs.existsSync(pathToBootstrap)) {
	throw new Error("Invalid path to bootstrap.");
}

const logFile = process.argv[3];
// After requiring the bootstrap we can use $injector
require(pathToBootstrap);

const fileLogService = $injector.resolve<IFileLogService>(FileLogService, { logFile });
fileLogService.logData({ message: "Initializing Cleanup process." });

const commandsInfos: ISpawnCommandInfo[] = [];
const filesToDelete: string[] = [];

const executeCleanup = async () => {
	const $childProcess = $injector.resolve<IChildProcess>("childProcess");
	for (const commandInfo of commandsInfos) {
		try {
			fileLogService.logData({ message: `Start executing command: ${JSON.stringify(commandInfo)}` });

			await $childProcess.trySpawnFromCloseEvent(commandInfo.command, commandInfo.args, {}, { throwError: true, timeout: commandInfo.timeout || 3000 });
			fileLogService.logData({ message: `Successfully executed command: ${JSON.stringify(commandInfo)}` });
		} catch (err) {
			fileLogService.logData({ message: `Unable to execute command: ${JSON.stringify(commandInfo)}`, type: FileLogMessageType.Error });
		}
	}

	if (filesToDelete.length) {
		fileLogService.logData({ message: `Deleting files ${filesToDelete.join(" ")}` });
		shelljs.rm("-Rf", filesToDelete);
	}

	fileLogService.logData({ message: `cleanup-process finished` });
	process.exit();
};

const addCleanupAction = (commandInfo: ISpawnCommandInfo): void => {
	if (_.some(commandsInfos, currentCommandInfo => _.isEqual(currentCommandInfo, commandInfo))) {
		fileLogService.logData({ message: `cleanup-process will not add command for execution as it has been added already: ${JSON.stringify(commandInfo)}` });
	} else {
		fileLogService.logData({ message: `cleanup-process added command for execution: ${JSON.stringify(commandInfo)}` });
		commandsInfos.push(commandInfo);
	}
};

const removeCleanupAction = (commandInfo: ISpawnCommandInfo): void => {
	if (_.some(commandsInfos, currentCommandInfo => _.isEqual(currentCommandInfo, commandInfo))) {
		_.remove(commandsInfos, currentCommandInfo => _.isEqual(currentCommandInfo, commandInfo));
		fileLogService.logData({ message: `cleanup-process removed command for execution: ${JSON.stringify(commandInfo)}` });
	} else {
		fileLogService.logData({ message: `cleanup-process cannot remove command for execution as it has note been added before: ${JSON.stringify(commandInfo)}` });
	}
};

const addDeleteAction = (filePath: string): void => {
	const fullPath = path.resolve(filePath);

	if (_.some(filesToDelete, f => f === fullPath)) {
		fileLogService.logData({ message: `cleanup-process will not add ${fullPath} for deletion as it has been added already` });
	} else {
		filesToDelete.push(fullPath);
		fileLogService.logData({ message: `cleanup-process added ${fullPath} for deletion` });
	}
};

const removeDeleteAction = (filePath: string): void => {
	const fullPath = path.resolve(filePath);

	if (_.some(filesToDelete, f => f === fullPath)) {
		_.remove(filesToDelete, f => f === fullPath);
		fileLogService.logData({ message: `cleanup-process removed ${fullPath} from the list of files for deletion.` });
	} else {
		fileLogService.logData({ message: `cleanup-process cannot remove ${fullPath} for deletion as no such entry is found in the files marked for deletion` });
	}
};

process.on("message", async (cleanupProcessMessage: ICleanupMessageBase) => {
	fileLogService.logData({ message: `cleanup-process received message of type: ${JSON.stringify(cleanupProcessMessage)}` });

	switch (cleanupProcessMessage.messageType) {
		case CleanupProcessMessage.AddCleanCommand:
			addCleanupAction((<ISpawnCommandCleanupMessage>cleanupProcessMessage).commandInfo);
			break;
		case CleanupProcessMessage.RemoveCleanCommand:
			removeCleanupAction((<ISpawnCommandCleanupMessage>cleanupProcessMessage).commandInfo);
			break;
		case CleanupProcessMessage.AddDeleteFileAction:
			addDeleteAction((<IDeleteFileCleanupMessage>cleanupProcessMessage).filePath);
			break;
		case CleanupProcessMessage.RemoveDeleteFileAction:
			removeDeleteAction((<IDeleteFileCleanupMessage>cleanupProcessMessage).filePath);
			break;
		default:
			fileLogService.logData({ message: `Unable to handle message of type ${cleanupProcessMessage.messageType}. Full message is ${JSON.stringify(cleanupProcessMessage)}`, type: FileLogMessageType.Error });
			break;
	}

});

process.on("disconnect", async () => {
	fileLogService.logData({ message: "cleanup-process received process.disconnect event" });
	await executeCleanup();
});

fileLogService.logData({ message: `cleanup-process will send ${DetachedProcessMessages.ProcessReadyToReceive} message` });

process.send(DetachedProcessMessages.ProcessReadyToReceive);
