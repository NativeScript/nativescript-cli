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
const jsCommands: IJSCommand[] = [];
const requests: IRequestInfo[] = [];

const executeRequest = async (request: IRequestInfo) => {
	const $httpClient = $injector.resolve<Server.IHttpClient>("httpClient");
	try {
		fileLogService.logData({ message: `Start executing request: ${request.method} ${request.url}` });
		const response = await $httpClient.httpRequest({
			url: request.url,
			method: request.method,
			headers: request.headers,
			body: request.body
		});
		const responseStatus = response && response.response && response.response.statusCode;
		fileLogService.logData({ message: `Finished executing request: ${request.method} ${request.url} and got status ${responseStatus}` });
	} catch (e) {
		fileLogService.logData({ message: `Unable to execute request: ${request.method} ${request.url}` });
	}
};

const executeJSCleanup = async (jsCommand: IJSCommand) => {
	const $childProcess = $injector.resolve<IChildProcess>("childProcess");

	try {
		fileLogService.logData({ message: `Start executing action for file: ${jsCommand.filePath} and data ${JSON.stringify(jsCommand.data)}` });

		await $childProcess.trySpawnFromCloseEvent(process.execPath, [path.join(__dirname, "cleanup-js-subprocess.js"), pathToBootstrap, logFile, jsCommand.filePath, JSON.stringify(jsCommand.data)], {}, { throwError: true, timeout: jsCommand.timeout || 3000 });
		fileLogService.logData({ message: `Finished executing action for file: ${jsCommand.filePath} and data ${JSON.stringify(jsCommand.data)}` });

	} catch (err) {
		fileLogService.logData({ message: `Unable to execute action for file ${jsCommand.filePath} with data ${JSON.stringify(jsCommand.data)}. Error is: ${err}.`, type: FileLogMessageType.Error });
	}
};

const executeCleanup = async () => {
	const $childProcess = $injector.resolve<IChildProcess>("childProcess");

	for (const request of requests) {
		await executeRequest(request);
	}

	for (const jsCommand of jsCommands) {
		await executeJSCleanup(jsCommand);
	}

	for (const commandInfo of commandsInfos) {
		try {
			fileLogService.logData({ message: `Start executing command: ${JSON.stringify(commandInfo)}` });

			await $childProcess.trySpawnFromCloseEvent(commandInfo.command, commandInfo.args, commandInfo.options || {}, { throwError: true, timeout: commandInfo.timeout || 3000 });
			fileLogService.logData({ message: `Successfully executed command: ${JSON.stringify(commandInfo)}` });
		} catch (err) {
			fileLogService.logData({ message: `Unable to execute command: ${JSON.stringify(commandInfo)}. Error is: ${err}.`, type: FileLogMessageType.Error });
		}
	}

	if (filesToDelete.length) {
		try {
			fileLogService.logData({ message: `Deleting files ${filesToDelete.join(" ")}` });
			shelljs.rm("-Rf", filesToDelete);
		} catch (err) {
			fileLogService.logData({ message: `Unable to delete files: ${JSON.stringify(filesToDelete)}. Error is: ${err}.`, type: FileLogMessageType.Error });
		}
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
		fileLogService.logData({ message: `cleanup-process cannot remove command for execution as it has not been added before: ${JSON.stringify(commandInfo)}` });
	}
};

const addRequest = (requestInfo: IRequestInfo): void => {
	if (_.some(requests, currentRequestInfo => _.isEqual(currentRequestInfo, requestInfo))) {
		fileLogService.logData({ message: `cleanup-process will not add request for execution as it has been added already: ${JSON.stringify(requestInfo)}` });
	} else {
		fileLogService.logData({ message: `cleanup-process added request for execution: ${JSON.stringify(requestInfo)}` });
		requests.push(requestInfo);
	}
};

const removeRequest = (requestInfo: IRequestInfo): void => {
	if (_.some(requests, currentRequestInfo => _.isEqual(currentRequestInfo, currentRequestInfo))) {
		_.remove(requests, currentRequestInfo => _.isEqual(currentRequestInfo, requestInfo));
		fileLogService.logData({ message: `cleanup-process removed request for execution: ${JSON.stringify(requestInfo)}` });
	} else {
		fileLogService.logData({ message: `cleanup-process cannot remove request for execution as it has not been added before: ${JSON.stringify(requestInfo)}` });
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

const addJSFile = (jsCommand: IJSCommand): void => {
	const fullPath = path.resolve(jsCommand.filePath);

	jsCommand.filePath = fullPath;

	if (_.some(jsCommands, currentJSCommand => _.isEqual(currentJSCommand, jsCommand))) {
		fileLogService.logData({ message: `cleanup-process will not add JS file for execution as it has been added already: ${JSON.stringify(jsCommand)}` });
	} else {
		fileLogService.logData({ message: `cleanup-process added JS file for execution: ${JSON.stringify(jsCommand)}` });
		jsCommands.push(jsCommand);
	}
};

const removeJSFile = (jsCommand: IJSCommand): void => {
	const fullPath = path.resolve(jsCommand.filePath);

	jsCommand.filePath = fullPath;

	if (_.some(jsCommands, currentJSCommand => _.isEqual(currentJSCommand, jsCommand))) {
		_.remove(jsCommands, currentJSCommand => _.isEqual(currentJSCommand, jsCommand));
		fileLogService.logData({ message: `cleanup-process removed JS action for execution: ${JSON.stringify(jsCommand)}` });
	} else {
		fileLogService.logData({ message: `cleanup-process cannot remove JS action for execution as it has not been added before: ${JSON.stringify(jsCommand)}` });
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
		case CleanupProcessMessage.AddRequest:
			addRequest((<IRequestCleanupMessage>cleanupProcessMessage).requestInfo);
			break;
		case CleanupProcessMessage.RemoveRequest:
			removeRequest((<IRequestCleanupMessage>cleanupProcessMessage).requestInfo);
			break;
		case CleanupProcessMessage.AddDeleteFileAction:
			addDeleteAction((<IFileCleanupMessage>cleanupProcessMessage).filePath);
			break;
		case CleanupProcessMessage.RemoveDeleteFileAction:
			removeDeleteAction((<IFileCleanupMessage>cleanupProcessMessage).filePath);
			break;
		case CleanupProcessMessage.AddJSFileToRequire:
			const jsCleanupMessage = <IJSCleanupMessage>cleanupProcessMessage;
			addJSFile(jsCleanupMessage.jsCommand);
			break;
		case CleanupProcessMessage.RemoveJSFileToRequire:
			const msgToRemove = <IJSCleanupMessage>cleanupProcessMessage;
			removeJSFile(msgToRemove.jsCommand);
			break;
		default:
			fileLogService.logData({ message: `Unable to handle message of type ${cleanupProcessMessage.messageType}. Full message is ${JSON.stringify(cleanupProcessMessage)}`, type: FileLogMessageType.Error });
			break;
	}

});

process.on("disconnect", async () => {
	fileLogService.logData({ message: "cleanup-process received process.disconnect event" });
	await executeCleanup();
	$injector.dispose();
	process.exit();
});

fileLogService.logData({ message: `cleanup-process will send ${DetachedProcessMessages.ProcessReadyToReceive} message` });

process.send(DetachedProcessMessages.ProcessReadyToReceive);
