/**
 * Central reporting point for invocations of legacy/deprecated CLI APIs.
 *
 * The severity is a single dial so the same call sites can be staged over
 * releases: trace (observe usage) → warn (tell users) → error (removal).
 * `NS_DEPRECATIONS=warn|error` previews a stricter stage ahead of the default.
 */

type DeprecationStage = "trace" | "warn" | "error";

const DEFAULT_STAGE: DeprecationStage = "trace";

interface IDeprecationLogger {
	trace(...args: any[]): void;
	warn(...args: any[]): void;
}

export interface IDeprecationReport {
	/** Stable identifier of the deprecated API, e.g. "hooks.param-name-signature". */
	api: string;
	/** Distinguishes call sites of one API, e.g. a hook path or extension name. */
	detail?: string;
	/**
	 * Logger to report through. When omitted, the logger is resolved lazily from
	 * the global injector at call time — never at import time — and the report
	 * is dropped if no logger is resolvable yet.
	 */
	logger?: IDeprecationLogger;
}

const reported = new Set<string>();

export function reportDeprecation(report: IDeprecationReport): void {
	const stage = getDeprecationStage();
	const message = formatMessage(report);

	if (stage === "error") {
		throw new Error(message);
	}

	const key = report.detail ? `${report.api}::${report.detail}` : report.api;
	if (reported.has(key)) {
		return;
	}
	reported.add(key);

	const logger = report.logger || tryResolveGlobalLogger();
	if (!logger) {
		return;
	}

	if (stage === "warn") {
		logger.warn(message);
	} else {
		logger.trace(message);
	}
}

/** Test seam: reports are deduplicated once per process otherwise. */
export function clearReportedDeprecations(): void {
	reported.clear();
}

function formatMessage(report: IDeprecationReport): string {
	const detail = report.detail ? ` (${report.detail})` : "";
	return (
		`Legacy CLI API used: ${report.api}${detail}. ` +
		`This API is planned for deprecation in a future release; ` +
		`set NS_DEPRECATIONS=warn or NS_DEPRECATIONS=error to preview stricter handling.`
	);
}

function getDeprecationStage(): DeprecationStage {
	const value = (process.env.NS_DEPRECATIONS || "").toLowerCase();
	if (value === "warn" || value === "error" || value === "trace") {
		return value;
	}
	return DEFAULT_STAGE;
}

function tryResolveGlobalLogger(): IDeprecationLogger | null {
	try {
		const globalInjector = (<any>global).$injector;
		if (!globalInjector) {
			return null;
		}
		return globalInjector.resolve("logger");
	} catch (err) {
		return null;
	}
}
