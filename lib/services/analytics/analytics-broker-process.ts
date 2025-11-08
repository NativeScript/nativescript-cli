// NOTE: This file is used to track data in a separate process.
// The instances here are not shared with the ones in main CLI process.
import * as fs from "fs";
import * as _ from "lodash";
import { AnalyticsBroker } from "./analytics-broker";
import { FileLogService } from "../../detached-processes/file-log-service";
import { IAnalyticsBroker, ITrackingInformation } from "./analytics";
import { injector } from "../../common/yok";
import { TrackingTypes } from "../../common/declarations";

const pathToBootstrap = process.argv[2];
if (!pathToBootstrap || !fs.existsSync(pathToBootstrap)) {
	throw new Error("Invalid path to bootstrap.");
}

const logFile = process.argv[3];
// After requiring the bootstrap we can use $injector
require(pathToBootstrap);

const analyticsLoggingService = injector.resolve<IFileLogService>(
	FileLogService,
	{ logFile },
);
analyticsLoggingService.logData({ message: "Initializing AnalyticsBroker." });

const analyticsBroker = injector.resolve<IAnalyticsBroker>(AnalyticsBroker, {
	pathToBootstrap,
	analyticsLoggingService,
});

let trackingQueue: Promise<void> = Promise.resolve();

const sendDataForTracking = async (data: ITrackingInformation) => {
	trackingQueue = trackingQueue.then(() =>
		analyticsBroker.sendDataForTracking(data),
	);
	await trackingQueue;
};

const finishTracking = async (data?: ITrackingInformation) => {
	analyticsLoggingService.logData({
		message: `analytics-broker-process finish tracking started`,
	});
	await trackingQueue;
	analyticsLoggingService.logData({
		message: `analytics-broker-process tracking finished`,
	});
};

const killCurrentProcessGracefully = () => {
	injector.dispose();
	process.exit();
};

process.on("message", async (data: ITrackingInformation) => {
	analyticsLoggingService.logData({
		message: `analytics-broker-process received message of type: ${JSON.stringify(
			data,
		)}`,
	});

	if (data.type === TrackingTypes.FinishTracking) {
		await finishTracking();

		if (process.connected) {
			analyticsLoggingService.logData({
				message: `analytics-broker-process will send ${DetachedProcessMessages.ProcessFinishedTasks} message`,
			});
			process.send(
				DetachedProcessMessages.ProcessFinishedTasks,
				null,
				null,
				() => {
					analyticsLoggingService.logData({
						message: `analytics-broker-process sent ${DetachedProcessMessages.ProcessFinishedTasks} message and will exit gracefully now`,
					});
					killCurrentProcessGracefully();
				},
			);
		}

		return;
	}

	await sendDataForTracking(data);
});

process.on("disconnect", async () => {
	analyticsLoggingService.logData({
		message: "analytics-broker-process received process.disconnect event",
	});
	await finishTracking();
	killCurrentProcessGracefully();
});

analyticsLoggingService.logData({
	message: `analytics-broker-process will send ${DetachedProcessMessages.ProcessReadyToReceive} message`,
});

process.send(DetachedProcessMessages.ProcessReadyToReceive);
