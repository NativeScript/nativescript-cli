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

/**
 * The newest log format the CLI understands, written to the logFormat key of
 * the app's package.json. The runtime uses the lower of this and its own.
 */
export const IOS_LOG_FORMAT = 1;

// Format 1: each piece of a message the runtime had to split is logged as
// "[ns <id> <index>/<count>] <piece>". The id is unique per message in the
// process, and the pieces are consecutive slices of the message. A piece of
// nothing but whitespace arrives as the bare header: the unified log strips
// whitespace from the end of every entry.
export const IOS_LOG_PIECE_HEADER = /^\[ns ([0-9a-f]+) (\d+)\/(\d+)\](?: |$)/;

// Where a piece that never arrived belongs; os_log marks truncated text alike.
const LOST_PIECE = "<…lost…>";

// Long enough to ride out a backlog of pieces, while a message whose pieces
// never all arrive, because os_log dropped some or the app crashed, still gets
// printed.
const PIECE_WAIT_MS = 500;

interface IPendingLogMessage {
	entry: Mobile.IiOSLogEntry;
	pieces: string[];
	received: number;
	timer: NodeJS.Timeout;
}

/**
 * Reassembles messages the runtime split to get them through os_log.
 */
export class IOSLogChunkStitcher {
	private pending = new Map<string, IPendingLogMessage>();

	/**
	 * @param source Identifies the logging process, whose message ids are unique.
	 * @param emit Called with each complete entry, in place of its pieces.
	 */
	public add(
		source: string,
		entry: Mobile.IiOSLogEntry,
		emit: (entry: Mobile.IiOSLogEntry) => void,
	): void {
		const header = (entry.message || "").match(IOS_LOG_PIECE_HEADER);
		const index = header ? Number(header[2]) - 1 : -1;
		const count = header ? Number(header[3]) : 0;
		if (!header || index < 0 || index >= count) {
			emit(entry);
			return;
		}

		const key = `${source}:${header[1]}`;
		let message = this.pending.get(key);
		if (!message || message.pieces.length !== count) {
			message = {
				entry,
				pieces: new Array(count),
				received: 0,
				timer: null,
			};
			this.pending.set(key, message);
		}
		if (message.pieces[index] === undefined) {
			message.pieces[index] = entry.message.slice(header[0].length);
			message.received++;
		}
		if (index === 0) {
			message.entry = entry;
		}

		clearTimeout(message.timer);
		const finish = () => {
			this.pending.delete(key);
			emit({ ...message.entry, message: joinPieces(message) });
		};
		if (message.received === count) {
			finish();
			return;
		}

		message.timer = setTimeout(finish, PIECE_WAIT_MS);
		message.timer.unref();
	}
}

function joinPieces(message: IPendingLogMessage): string {
	let text = "";
	for (let i = 0; i < message.pieces.length; i++) {
		if (message.pieces[i] === undefined) {
			if (!text.endsWith(LOST_PIECE)) {
				text += LOST_PIECE;
			}
			continue;
		}
		text += message.pieces[i];
	}
	return text;
}
