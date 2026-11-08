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

describe("getIOSLogEntryText for forwarded stdio", () => {
	const entry = {
		process: "/var/containers/Bundle/Application/X/app.app/app",
		image: "/private/Frameworks/NativeScript.framework/NativeScript",
		level: "default",
		message: "printed",
		subsystem: "org.nativescript.stdio",
		category: "stdout",
	};

	it("is hidden by default, unlike the runtime's console output", () => {
		assert.isNull(getIOSLogEntryText(entry, { processName: "app" }));
	});

	it("is labeled with its stream along with native output", () => {
		assert.equal(
			getIOSLogEntryText(
				{ ...entry, category: "stderr" },
				{ processName: "app", includeNative: true },
			),
			"stderr: printed",
		);
	});

	it("is labeled once when a long line was split", () => {
		const stitcher = new IOSLogChunkStitcher();
		const printed: string[] = [];
		for (const message of ["[ns 4 1/2] one", "[ns 4 2/2]  two"]) {
			stitcher.add("process", { ...entry, message }, (complete) =>
				printed.push(
					getIOSLogEntryText(complete, {
						processName: "app",
						includeNative: true,
					}),
				),
			);
		}
		assert.deepEqual(printed, ["stdout: one two"]);
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
	let stitcher: IOSLogChunkStitcher;
	let messages: string[];
	let clock: sinon.SinonFakeTimers;
	const add = (message: string, source = "process") =>
		stitcher.add(
			source,
			{ process: "app", image: "NativeScript", level: "default", message },
			(entry) => messages.push(entry.message),
		);

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

	it("joins the pieces of a message as they are", () => {
		add('[ns 1f 1/3] CONSOLE LOG: {"a":');
		add('[ns 1f 2/3] 1,"b":');
		assert.isEmpty(messages);
		add("[ns 1f 3/3] 2}");
		assert.deepEqual(messages, ['CONSOLE LOG: {"a":1,"b":2}']);
	});

	it("keeps the whitespace a piece starts with", () => {
		add("[ns 2 1/3] CONSOLE ERROR: first");
		add("[ns 2 2/3]  \nsecond");
		add("[ns 2 3/3]   third");
		assert.deepEqual(messages, ["CONSOLE ERROR: first \nsecond  third"]);
	});

	it("takes a bare header for a piece of nothing but whitespace", () => {
		add("[ns 9 1/3] CONSOLE LOG: a");
		add("[ns 9 2/3]");
		add("[ns 9 3/3]  b");
		assert.deepEqual(messages, ["CONSOLE LOG: a b"]);
	});

	it("keeps interleaved messages apart by id", () => {
		add("[ns a 1/2] CONSOLE LOG: a1");
		add("[ns b 1/2] CONSOLE LOG: b1");
		add("CONSOLE LOG: other");
		add("[ns a 2/2] a2");
		add("[ns b 2/2] b2");
		assert.deepEqual(messages, [
			"CONSOLE LOG: other",
			"CONSOLE LOG: a1a2",
			"CONSOLE LOG: b1b2",
		]);
	});

	it("keeps the same id from different processes apart", () => {
		add("[ns 1 1/2] CONSOLE LOG: old", "launch-1");
		add("[ns 1 1/2] CONSOLE LOG: new", "launch-2");
		add("[ns 1 2/2] !", "launch-2");
		assert.deepEqual(messages, ["CONSOLE LOG: new!"]);
	});

	it("never joins the next message onto one whose last piece was lost", () => {
		add("[ns 5 1/3] CONSOLE LOG: AAAA");
		add("[ns 5 2/3] aaaa");
		add("CONSOLE ERROR: B failed");
		assert.deepEqual(messages, ["CONSOLE ERROR: B failed"]);

		clock.tick(500);
		assert.deepEqual(messages, [
			"CONSOLE ERROR: B failed",
			"CONSOLE LOG: AAAAaaaa<…lost…>",
		]);
	});

	it("marks where a lost piece belongs", () => {
		add("[ns 6 1/4] CONSOLE LOG: one\n");
		add("[ns 6 4/4] four");
		clock.tick(500);
		assert.deepEqual(messages, ["CONSOLE LOG: one\n<…lost…>four"]);
	});

	it("prints what it has when the rest never arrives", () => {
		add("[ns 7 2/2] tail");
		clock.tick(499);
		assert.isEmpty(messages);
		clock.tick(1);
		assert.deepEqual(messages, ["<…lost…>tail"]);
	});

	it("passes through text that only looks like a header", () => {
		add("[ns 8 3/2] CONSOLE LOG: x");
		add("[ns zz 1/2] CONSOLE LOG: y");
		assert.deepEqual(messages, [
			"[ns 8 3/2] CONSOLE LOG: x",
			"[ns zz 1/2] CONSOLE LOG: y",
		]);
	});
});
