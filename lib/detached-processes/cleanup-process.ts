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

const actionsToExecute: ICleanupAction[] = [];
const filesToDelete: string[] = [];

const executeCleanup = async () => {
	const $childProcess = $injector.resolve<IChildProcess>("childProcess");
	for (const action of actionsToExecute) {
		try {
			fileLogService.logData({ message: `Start executing action: ${JSON.stringify(action)}` });

			// TODO: Add timeout for each action here
			await $childProcess.trySpawnFromCloseEvent(action.command, action.args);
			fileLogService.logData({ message: `Successfully executed action: ${JSON.stringify(action)}` });
		} catch (err) {
			fileLogService.logData({ message: `Unable to execute action: ${JSON.stringify(action)}`, type: FileLogMessageType.Error });
		}
	}

	if (filesToDelete.length) {
		fileLogService.logData({ message: `Deleting files ${filesToDelete.join(" ")}` });
		shelljs.rm("-Rf", filesToDelete);
	}

	fileLogService.logData({ message: `cleanup-process finished` });
	process.exit();
};

const addCleanupAction = (newAction: ICleanupAction): void => {
	if (_.some(actionsToExecute, currentAction => _.isEqual(currentAction, newAction))) {
		fileLogService.logData({ message: `cleanup-process will not add action for execution as it has been added already: ${JSON.stringify(newAction)}` });
	} else {
		fileLogService.logData({ message: `cleanup-process added action for execution: ${JSON.stringify(newAction)}` });
		actionsToExecute.push(newAction);
	}
};

const removeCleanupAction = (actionToRemove: ICleanupAction): void => {
	if (_.some(actionsToExecute, currentAction => _.isEqual(currentAction, actionToRemove))) {
		_.remove(actionsToExecute, currentAction => _.isEqual(currentAction, actionToRemove));
		fileLogService.logData({ message: `cleanup-process removed action for execution: ${JSON.stringify(actionToRemove)}` });
	} else {
		fileLogService.logData({ message: `cleanup-process cannot remove action for execution as it has note been added before: ${JSON.stringify(actionToRemove)}` });
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

process.on("message", async (cleanupProcessMessage: ICleanupProcessMessage) => {
	fileLogService.logData({ message: `cleanup-process received message of type: ${JSON.stringify(cleanupProcessMessage)}` });

	switch (cleanupProcessMessage.actionType) {
		case CleanupProcessMessageType.AddCleanAction:
			addCleanupAction((<ICleanupActionMessage>cleanupProcessMessage).action);
			break;
		case CleanupProcessMessageType.RemoveCleanAction:
			removeCleanupAction((<ICleanupActionMessage>cleanupProcessMessage).action);
			break;
		case CleanupProcessMessageType.AddDeleteAction:
			addDeleteAction((<ICleanupDeleteActionMessage>cleanupProcessMessage).filePath);
			break;
		case CleanupProcessMessageType.RemoveDeleteAction:
			removeDeleteAction((<ICleanupDeleteActionMessage>cleanupProcessMessage).filePath);
			break;
		default:
			fileLogService.logData({ message: `Unable to handle message of type ${cleanupProcessMessage.actionType}. Full message is ${JSON.stringify(cleanupProcessMessage)}`, type: FileLogMessageType.Error });
			break;
	}

});

process.on("disconnect", async () => {
	fileLogService.logData({ message: "cleanup-process received process.disconnect event" });
	await executeCleanup();
});

fileLogService.logData({ message: `cleanup-process will send ${DetachedProcessMessages.ProcessReadyToReceive} message` });

process.send(DetachedProcessMessages.ProcessReadyToReceive);
