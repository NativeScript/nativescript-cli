import * as path from "path";

export interface IIOSLogEntryFilterOptions {
	/**
	 * Name of the application's executable. Entries are matched by name rather
	 * than pid, so the logs follow the app when it is relaunched.
	 */
	processName: string;
	/**
	 * Include everything the app's process logs - its own native code and the
	 * system frameworks it uses - like Xcode's console does.
	 */
	includeNative?: boolean;
	/**
	 * Include debug level entries as well.
	 */
	includeDebug?: boolean;
}

/**
 * Which of the app's logs to show, from the CLI's --log level: JS output by
 * default, everything but debug entries (like Xcode) with "debug", and
 * everything with "trace" or "all". A full device log level shows everything.
 */
export function getIOSLogScope(
	cliLogLevel: string,
	fullDeviceLog: boolean,
): Pick<IIOSLogEntryFilterOptions, "includeNative" | "includeDebug"> {
	const level = (cliLogLevel || "").toUpperCase();
	const includeDebug = fullDeviceLog || level === "TRACE" || level === "ALL";
	return {
		includeNative: includeDebug || level === "DEBUG",
		includeDebug,
	};
}

export function isIOSRuntimeLogEntry(entry: Mobile.IiOSLogEntry): boolean {
	return path.basename(entry.image || "") === "NativeScript";
}

// The runtime forwards the app's stdout and stderr under this subsystem, when
// the CLI asks for it through the forwardStdio key of the app's package.json.
const STDIO_SUBSYSTEM = "org.nativescript.stdio";

// Logged by the runtime itself on every launch, not by the app.
const RUNTIME_NOISE = ["NativeScript loaded bundle"];

/**
 * Returns the text to print for a structured iOS log entry, or null when the
 * entry should not be shown.
 *
 * JS console output and runtime errors are the entries logged by the
 * NativeScript framework; everything else in the app's process is native and
 * printed prefixed with the binary that logged it.
 */
export function getIOSLogEntryText(
	entry: Mobile.IiOSLogEntry,
	options: IIOSLogEntryFilterOptions,
): string | null {
	if (!entry || path.basename(entry.process || "") !== options.processName) {
		return null;
	}

	if (entry.subsystem === STDIO_SUBSYSTEM) {
		return options.includeNative ? `${entry.category}: ${entry.message}` : null;
	}

	const imageName = path.basename(entry.image || "");
	if (isIOSRuntimeLogEntry(entry)) {
		return RUNTIME_NOISE.some((noise) => entry.message.includes(noise))
			? null
			: entry.message;
	}

	if (
		!options.includeNative ||
		(entry.level === "debug" && !options.includeDebug)
	) {
		return null;
	}

	return `${imageName}: ${entry.message}`;
}

// The runtime ends a chunk of a split message with one of these when the CLI
// asks for it, through the logChunkMarkers key of the app's package.json.
const CHUNK_JOIN_MARKER = "\u2060";
const CHUNK_LINE_MARKER = "\u2061";
const REPEATED_PREFIX = /^(?:CONSOLE [A-Z]+|stdout|stderr): /;

// Long enough to ride out a backlog of chunks, while the rest of a message that
// never arrives, because the app crashed, still gets printed.
const CHUNK_WAIT_MS = 500;

interface IPendingLogMessage {
	text: string;
	prefix: string;
	separator: string;
	timer: NodeJS.Timeout;
}

/**
 * Reassembles messages the runtime split to get them through os_log.
 */
export class IOSLogChunkStitcher {
	private pending = new Map<string, IPendingLogMessage>();

	/**
	 * @param key Identifies the logging thread: chunks from different threads can interleave.
	 * @param emit Called with the complete message.
	 */
	public add(key: string, text: string, emit: (text: string) => void): void {
		const marker = text[text.length - 1];
		const continues =
			marker === CHUNK_JOIN_MARKER || marker === CHUNK_LINE_MARKER;
		const chunk = continues ? text.slice(0, -1) : text;

		const message = this.pending.get(key) ?? {
			text: "",
			prefix: chunk.match(REPEATED_PREFIX)?.[0] ?? "",
			separator: "",
			timer: null,
		};
		clearTimeout(message.timer);
		message.text +=
			message.separator +
			(message.text && chunk.startsWith(message.prefix)
				? chunk.slice(message.prefix.length)
				: chunk);

		if (!continues) {
			this.pending.delete(key);
			emit(message.text);
			return;
		}

		message.separator = marker === CHUNK_LINE_MARKER ? "\n" : "";
		message.timer = setTimeout(() => {
			this.pending.delete(key);
			emit(message.text);
		}, CHUNK_WAIT_MS);
		message.timer.unref();
		this.pending.set(key, message);
	}
}
