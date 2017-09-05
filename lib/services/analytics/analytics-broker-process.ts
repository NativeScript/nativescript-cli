import * as fs from "fs";
import { AnalyticsBroker } from "./analytics-broker";

const pathToBootstrap = process.argv[2];
if (!pathToBootstrap || !fs.existsSync(pathToBootstrap)) {
	throw new Error("Invalid path to bootstrap.");
}

// After requiring the bootstrap we can use $injector
require(pathToBootstrap);

const analyticsBroker = $injector.resolve<IAnalyticsBroker>(AnalyticsBroker, { pathToBootstrap });
let trackingQueue: Promise<void> = Promise.resolve();

let sentFinishMsg = false;
let receivedFinishMsg = false;

const sendDataForTracking = async (data: ITrackingInformation) => {
	trackingQueue = trackingQueue.then(() => analyticsBroker.sendDataForTracking(data));
	await trackingQueue;
};

const finishTracking = async (data?: ITrackingInformation) => {
	if (!sentFinishMsg) {
		sentFinishMsg = true;

		data = data || { type: TrackingTypes.Finish };
		const action = async () => {
			await sendDataForTracking(data);
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
	if (data.type === TrackingTypes.Finish) {
		receivedFinishMsg = true;
		await finishTracking(data);
		return;
	}

	await sendDataForTracking(data);
});

process.on("disconnect", async () => {
	await finishTracking();
});

process.send(AnalyticsMessages.BrokerReadyToReceive);
