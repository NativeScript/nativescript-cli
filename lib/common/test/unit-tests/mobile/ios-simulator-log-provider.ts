import { assert } from "chai";
import { EventEmitter } from "events";
import { PassThrough } from "stream";
import { IOSSimulatorLogProvider } from "../../../mobile/ios/simulator/ios-simulator-log-provider";
import { DevicePlatformsConstants } from "../../../mobile/device-platforms-constants";
import { CommonLoggerStub } from "../stubs";

const deviceId = "simulator-id";

class LogProcessStub extends EventEmitter {
	public stdout = new PassThrough();
	public stderr = new PassThrough();
	public kill(): void {}
}

const nextTick = () => new Promise((resolve) => setImmediate(resolve));

describe("IOSSimulatorLogProvider", () => {
	let logProcess: LogProcessStub;
	let logger: CommonLoggerStub;
	let entries: Mobile.IiOSLogEntry[];
	let provider: IOSSimulatorLogProvider;

	beforeEach(() => {
		logProcess = new LogProcessStub();
		logger = new CommonLoggerStub();
		entries = [];
		provider = new IOSSimulatorLogProvider(
			<any>{},
			logger,
			new DevicePlatformsConstants(),
			<any>{
				getProjectNameForDevice: () => "app",
				logEntry: (entry: Mobile.IiOSLogEntry) => entries.push(entry),
				logData: () => assert.fail("structured logs never go through logData"),
			},
			<any>{ spawn: () => logProcess },
		);
	});

	it("maps log stream ndjson events to log entries", async () => {
		await provider.startLogProcess(deviceId);
		logProcess.stdout.write(
			'Filtering the log data using "process == \\"app\\""\n' +
				JSON.stringify({
					eventType: "logEvent",
					processID: 42,
					threadID: 7,
					processImagePath: "/apps/app.app/app",
					senderImagePath:
						"/apps/app.app/Frameworks/NativeScript.framework/NativeScript",
					messageType: "Default",
					eventMessage: "CONSOLE LOG: hello",
				}) +
				"\n" +
				JSON.stringify({ eventType: "activityCreateEvent" }) +
				"\n",
		);
		await nextTick();

		assert.deepEqual(entries, [
			{
				pid: 42,
				thread: 7,
				process: "/apps/app.app/app",
				image: "/apps/app.app/Frameworks/NativeScript.framework/NativeScript",
				level: "default",
				message: "CONSOLE LOG: hello",
			},
		]);
	});

	it("traces what log stream writes to stderr", async () => {
		await provider.startLogProcess(deviceId);
		logProcess.stderr.write("log: Invalid predicate\n");
		await nextTick();

		assert.isEmpty(entries);
		assert.include(logger.traceOutput, "log: Invalid predicate");
	});
});
