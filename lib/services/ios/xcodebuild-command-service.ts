import * as constants from "../../constants";
import { injector } from "../../common/yok";
import {
	ISpawnResult,
	IErrors,
	IChildProcess,
} from "../../common/declarations";

export class XcodebuildCommandService implements IXcodebuildCommandService {
	constructor(
		private $childProcess: IChildProcess,
		private $errors: IErrors,
		private $logger: ILogger,
	) {}

	public async executeCommand(
		args: string[],
		options: {
			cwd: string;
			stdio?: string;
			message?: string;
			spawnOptions?: any;
			// When provided, xcodebuild's output is piped (rather than inherited)
			// and forwarded here line-by-line so the caller can render its own
			// progress UI (e.g. a spinner for SPM resolution/download activity).
			onProgress?: (chunk: { data: string; pipe: string }) => void;
		},
	): Promise<ISpawnResult> {
		const { message, cwd, stdio, spawnOptions, onProgress } = options;

		// A caller rendering its own progress UI owns stdout, so skip the
		// default "Xcode build..." line that would otherwise clobber it.
		if (!onProgress) {
			this.$logger.info(message || "Xcode build...");
		}

		const childProcessOptions = {
			cwd,
			stdio: onProgress ? "pipe" : stdio || "inherit",
		};

		let detachProgress: () => void;
		if (onProgress) {
			const handler = (chunk: { data: string; pipe: string }) =>
				onProgress(chunk);
			this.$childProcess.on(constants.BUILD_OUTPUT_EVENT_NAME, handler);
			detachProgress = () =>
				this.$childProcess.removeListener(
					constants.BUILD_OUTPUT_EVENT_NAME,
					handler,
				);
		}

		try {
			const commandResult = await this.$childProcess.spawnFromEvent(
				"xcodebuild",
				args,
				"exit",
				childProcessOptions,
				spawnOptions || {
					emitOptions: { eventName: constants.BUILD_OUTPUT_EVENT_NAME },
					throwError: true,
				},
			);

			return commandResult;
		} catch (err) {
			this.$errors.fail(err.message);
		} finally {
			detachProgress?.();
		}
	}
}
injector.register("xcodebuildCommandService", XcodebuildCommandService);
