import { assert } from "chai";
import { Yok, getInjector, setGlobalInjector } from "../lib/common/yok";
import {
	reportDeprecation,
	clearReportedDeprecations,
} from "../lib/common/deprecation";
import { LoggerStub } from "./stubs";

describe("deprecation tracer", () => {
	let logger: LoggerStub;
	let originalEnv: string | undefined;

	beforeEach(() => {
		logger = new LoggerStub();
		clearReportedDeprecations();
		originalEnv = process.env.NS_DEPRECATIONS;
		delete process.env.NS_DEPRECATIONS;
	});

	afterEach(() => {
		if (originalEnv === undefined) {
			delete process.env.NS_DEPRECATIONS;
		} else {
			process.env.NS_DEPRECATIONS = originalEnv;
		}
	});

	it("logs at trace level by default and reports once per api+detail", () => {
		reportDeprecation({ api: "test.api", detail: "site-1", logger });
		reportDeprecation({ api: "test.api", detail: "site-1", logger });

		const occurrences = logger.traceOutput.split("test.api").length - 1;
		assert.equal(occurrences, 1);
		assert.equal(logger.warnOutput, "");

		reportDeprecation({ api: "test.api", detail: "site-2", logger });
		assert.include(logger.traceOutput, "site-2");
	});

	it("escalates to warn with NS_DEPRECATIONS=warn", () => {
		process.env.NS_DEPRECATIONS = "warn";

		reportDeprecation({ api: "test.warn", logger });

		assert.include(logger.warnOutput, "test.warn");
		assert.equal(logger.traceOutput, "");
	});

	it("throws with NS_DEPRECATIONS=error — on every call, not just the first", () => {
		process.env.NS_DEPRECATIONS = "error";

		assert.throws(
			() => reportDeprecation({ api: "test.error", logger }),
			/test\.error/,
		);
		assert.throws(
			() => reportDeprecation({ api: "test.error", logger }),
			/test\.error/,
		);
	});

	it("falls back to the process-wide injector's logger when none is passed", () => {
		const previousInjector = getInjector();
		const freshInjector = new Yok();
		const freshLogger = new LoggerStub();
		freshInjector.register("logger", freshLogger);
		setGlobalInjector(freshInjector);

		try {
			reportDeprecation({ api: "test.global-logger" });
			assert.include(freshLogger.traceOutput, "test.global-logger");
		} finally {
			setGlobalInjector(previousInjector);
		}
	});

	it("drops the report silently when no logger is resolvable", () => {
		const previousInjector = getInjector();
		setGlobalInjector(new Yok());

		try {
			assert.doesNotThrow(() => reportDeprecation({ api: "test.no-logger" }));
		} finally {
			setGlobalInjector(previousInjector);
		}
	});

	it("still delivers a report that was previously dropped for lack of a logger", () => {
		const previousInjector = getInjector();
		setGlobalInjector(new Yok());
		try {
			reportDeprecation({ api: "test.redeliver" });
		} finally {
			setGlobalInjector(previousInjector);
		}

		reportDeprecation({ api: "test.redeliver", logger });

		assert.include(logger.traceOutput, "test.redeliver");
	});
});
