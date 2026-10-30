import { assert } from "chai";
import * as sinon from "sinon";
import {
	getIOSLogEntryText,
	getIOSLogScope,
	IOSLogChunkStitcher,
} from "../../../mobile/ios/ios-log-entry";

const appDir =
	"/private/var/containers/Bundle/Application/CFC7170F-ACC6-429C-942C-FF90EDC34D47/app.app";

const entry = (image: string, message: string, process = `${appDir}/app`) => ({
	process,
	image,
	level: "notice",
	message,
});

const jsLog = entry(
	`${appDir}/Frameworks/NativeScript.framework/NativeScript`,
	'CONSOLE LOG: [ "network", "internet probe -> true (status 200)" ]',
);
const appFrameworkLog = entry(
	`${appDir}/Frameworks/LightLib.framework/LightLib`,
	"universe 1 updated",
);
const systemFrameworkLog = entry(
	"/System/Library/Frameworks/Network.framework/Network",
	"nw_connection_report_state_with_handler_on_nw_queue [C2] reporting state cancelled",
);
const kernelLog = entry(
	"",
	"wlan0:com.apple.p2p.awdl0: isInfraRealtimePacketThresholdAllowed allowed:1",
	"/kernel",
);

describe("getIOSLogEntryText", () => {
	const debugLog = { ...systemFrameworkLog, level: "debug" };

	it("returns JS console output of the app", () => {
		assert.equal(
			getIOSLogEntryText(jsLog, { processName: "app" }),
			jsLog.message,
		);
	});

	it("drops entries of other processes", () => {
		assert.isNull(getIOSLogEntryText(kernelLog, { processName: "app" }));
		assert.isNull(
			getIOSLogEntryText(kernelLog, {
				processName: "app",
				includeNative: true,
				includeDebug: true,
			}),
		);
		assert.isNull(getIOSLogEntryText(jsLog, { processName: "otherApp" }));
	});

	it("drops native entries unless they are requested", () => {
		assert.isNull(getIOSLogEntryText(appFrameworkLog, { processName: "app" }));
		assert.isNull(
			getIOSLogEntryText(systemFrameworkLog, { processName: "app" }),
		);
	});

	it("includes everything the app's process logs, prefixed with the binary, when native logs are requested", () => {
		const options = { processName: "app", includeNative: true };

		assert.equal(
			getIOSLogEntryText(appFrameworkLog, options),
			"LightLib: universe 1 updated",
		);
		assert.equal(
			getIOSLogEntryText(systemFrameworkLog, options),
			`Network: ${systemFrameworkLog.message}`,
		);
		assert.isNull(getIOSLogEntryText(debugLog, options));
	});

	it("includes debug entries only when requested", () => {
		assert.equal(
			getIOSLogEntryText(debugLog, {
				processName: "app",
				includeNative: true,
				includeDebug: true,
			}),
			`Network: ${debugLog.message}`,
		);
	});

	it("drops the runtime's own startup message", () => {
		assert.isNull(
			getIOSLogEntryText(
				{ ...jsLog, message: "NativeScript loaded bundle file:///app/" },
				{ processName: "app" },
			),
		);
	});
});

describe("getIOSLogScope", () => {
	it("maps the CLI log level to the app logs that are shown", () => {
		assert.deepEqual(getIOSLogScope("INFO", false), {
			includeNative: false,
			includeDebug: false,
		});
		assert.deepEqual(getIOSLogScope("DEBUG", false), {
			includeNative: true,
			includeDebug: false,
		});
		assert.deepEqual(getIOSLogScope("TRACE", false), {
			includeNative: true,
			includeDebug: true,
		});
		assert.deepEqual(getIOSLogScope("ALL", false), {
			includeNative: true,
			includeDebug: true,
		});
	});

	it("shows everything for a full device log", () => {
		assert.deepEqual(getIOSLogScope("INFO", true), {
			includeNative: true,
			includeDebug: true,
		});
	});
});

describe("IOSLogChunkStitcher", () => {
	const JOIN = "\u2060";
	const LINE = "\u2061";
	let stitcher: IOSLogChunkStitcher;
	let messages: string[];
	let clock: sinon.SinonFakeTimers;
	const add = (text: string, key = "thread") =>
		stitcher.add(key, text, (message) => messages.push(message));

	beforeEach(() => {
		clock = sinon.useFakeTimers();
		stitcher = new IOSLogChunkStitcher();
		messages = [];
	});

	afterEach(() => {
		clock.restore();
	});

	it("passes through messages that were not split", () => {
		add("CONSOLE LOG: hello");
		assert.deepEqual(messages, ["CONSOLE LOG: hello"]);
	});

	it("rejoins chunks without the repeated prefix", () => {
		add(`CONSOLE LOG: {"a":${JOIN}`);
		add(`CONSOLE LOG: 1,"b":${JOIN}`);
		assert.isEmpty(messages);
		add("CONSOLE LOG: 2}");
		assert.deepEqual(messages, ['CONSOLE LOG: {"a":1,"b":2}']);
	});

	it("restores the line break a chunk was cut at", () => {
		add(`CONSOLE ERROR: first${LINE}`);
		add("CONSOLE ERROR: second");
		assert.deepEqual(messages, ["CONSOLE ERROR: first\nsecond"]);
	});

	it("rejoins messages that have no prefix", () => {
		add(`Assertion failed: a${JOIN}`);
		add("b");
		assert.deepEqual(messages, ["Assertion failed: ab"]);
	});

	it("keeps a chunk's own text when it only looks like a prefix", () => {
		add(`CONSOLE LOG: a${JOIN}`);
		add("CONSOLE ERROR: b");
		assert.deepEqual(messages, ["CONSOLE LOG: aCONSOLE ERROR: b"]);
	});

	it("keeps interleaved threads apart", () => {
		add(`CONSOLE LOG: a1${JOIN}`, "a");
		add(`CONSOLE LOG: b1${JOIN}`, "b");
		add("CONSOLE LOG: other", "c");
		add("CONSOLE LOG: a2", "a");
		add("CONSOLE LOG: b2", "b");
		assert.deepEqual(messages, [
			"CONSOLE LOG: other",
			"CONSOLE LOG: a1a2",
			"CONSOLE LOG: b1b2",
		]);
	});

	it("prints what it has when the rest never arrives", () => {
		add(`CONSOLE LOG: a${JOIN}`);
		clock.tick(500);
		assert.deepEqual(messages, ["CONSOLE LOG: a"]);

		add("CONSOLE LOG: unrelated");
		assert.deepEqual(messages, ["CONSOLE LOG: a", "CONSOLE LOG: unrelated"]);
	});
});
