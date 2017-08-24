import * as fs from "fs";
import { EqatectAnalyticsService } from "./eqatec-analytics";

const pathToBootstrap = process.argv[2];
if (!pathToBootstrap || !fs.existsSync(pathToBootstrap)) {
	throw new Error("Invalid path to bootstrap.");
}

// After requiring the bootstrap we can use $injector
require(pathToBootstrap);

let eqatecAnalyticsService: EqatectAnalyticsService = null;

const assertEqatecAnalyticsIsInitialized = () => {
	if (!eqatecAnalyticsService) {
		throw new Error("Analytics service is not initialized yet. Unable to send data.");
	}
};

let trackingQueue = Promise.resolve();

let receivedFinishMsg = false;
let hasStoppedEqatecProcess = false;

const stopAnalyticsProcess = async () => {
	try {
		trackingQueue = trackingQueue.then(() => eqatecAnalyticsService.tryStopEqatecMonitor());
		await trackingQueue;

		eqatecAnalyticsService = null;
		process.disconnect();
	} catch (err) {
		process.exit(ErrorCodes.FAILED_EQATEC_ANALYTICS_PROCESS);
	}
};

const finishTracking = async () => {
	if (!hasStoppedEqatecProcess) {
		hasStoppedEqatecProcess = true;

		if (receivedFinishMsg) {
			await stopAnalyticsProcess();
		} else {
			// In case we've got here without receiving "finish" message from parent (receivedFinishMsg is false)
			// there might be various reasons, but most probably the parent is dead.
			// However, there's no guarantee that we've received all messages. So wait some time before sending finish message to children.
			setTimeout(async () => {
				await stopAnalyticsProcess();
			}, 1000);
		}
	}
};

process.on("message", async (data: ITrackingInformation) => {
	switch (data.type) {
		case TrackingTypes.Initialization:
			const analyticsSettings = <IEqatecInitializeData>data;
			eqatecAnalyticsService = $injector.resolve<EqatectAnalyticsService>(EqatectAnalyticsService, { analyticsSettings });

			break;
		case TrackingTypes.Feature:
			assertEqatecAnalyticsIsInitialized();
			const trackFeatureInfo = <IFeatureTrackingInformation>data;
			trackingQueue = trackingQueue.then(() => eqatecAnalyticsService.trackInformation(trackFeatureInfo));
			await trackingQueue;

			break;
		case TrackingTypes.Exception:
			assertEqatecAnalyticsIsInitialized();
			const exceptionInfo = <IExceptionsTrackingInformation>data;
			trackingQueue = trackingQueue.then(() => eqatecAnalyticsService.trackError(exceptionInfo));
			await trackingQueue;

			break;

		case TrackingTypes.Finish:
			receivedFinishMsg = true;
			await finishTracking();
			break;
		default:
			break;
	}
});

process.on("disconnect", async () => {
	await finishTracking();
});

process.send(AnalyticsMessages.EqatecAnalyticsReadyToReceive);
