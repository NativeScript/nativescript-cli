// NOTE: This file is used to track data in a separate process.
// The instances here are not shared with the ones in main CLI process.
import * as fs from "fs";
import { AnalyticsBroker } from "./analytics-broker";
import { AnalyticsLoggingService } from "./analytics-logging-service";

const pathToBootstrap = process.argv[2];
if (!pathToBootstrap || !fs.existsSync(pathToBootstrap)) {
	throw new Error("Invalid path to bootstrap.");
}

const logFile = process.argv[3];
// After requiring the bootstrap we can use $injector
require(pathToBootstrap);

const analyticsLoggingService = $injector.resolve<IAnalyticsLoggingService>(AnalyticsLoggingService, { logFile });
analyticsLoggingService.logData({ message: "Initializing AnalyticsBroker." });

const analyticsBroker = $injector.resolve<IAnalyticsBroker>(AnalyticsBroker, { pathToBootstrap, analyticsLoggingService });

let trackingQueue: Promise<void> = Promise.resolve();

let sentFinishMsg = false;
let receivedFinishMsg = false;

const sendDataForTracking = async (data: ITrackingInformation) => {
	trackingQueue = trackingQueue.then(() => analyticsBroker.sendDataForTracking(data));
	await trackingQueue;
};

const finishTracking = async (data?: ITrackingInformation) => {
	analyticsLoggingService.logData({ message: `analytics-broker-process finish tracking started, sentFinishMsg: ${sentFinishMsg}, receivedFinishMsg: ${receivedFinishMsg}` });

	if (!sentFinishMsg) {
		sentFinishMsg = true;

		data = data || { type: TrackingTypes.Finish };
		const action = async () => {
			await trackingQueue;
			analyticsLoggingService.logData({ message: `analytics-broker-process tracking finished` });
			process.disconnect();
		};

		if (receivedFinishMsg) {
			await action();
		} else {
			// In case we've got here without receiving "finish" message from parent (receivedFinishMsg is false)
			// there might be various reasons, but most probably the parent is dead.
			// However, there's no guarantee that we've received all messages. So wait some time before sending finish message to children.
			setTimeout(async () => {
				await action();
			}, 1000);
		}
	}
};

process.on("message", async (data: ITrackingInformation) => {
	analyticsLoggingService.logData({ message: `analytics-broker-process received message of type: ${data.type}` });

	if (data.type === TrackingTypes.Finish) {
		receivedFinishMsg = true;
		await finishTracking(data);
		return;
	}

	await sendDataForTracking(data);
});

process.on("disconnect", async () => {
	analyticsLoggingService.logData({ message: "analytics-broker-process received process.disconnect event" });
	await finishTracking();
});

analyticsLoggingService.logData({ message: `analytics-broker-process will send ${AnalyticsMessages.BrokerReadyToReceive} message` });

process.send(AnalyticsMessages.BrokerReadyToReceive);
