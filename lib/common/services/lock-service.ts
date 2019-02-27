import * as lockfile from "lockfile";
import * as path from "path";
import { cache } from "../decorators";

export class LockService implements ILockService {
	private currentlyLockedFiles: string[] = [];

	@cache()
	private get defaultLockFilePath(): string {
		return this.getAbsoluteLockFilePath("lockfile.lock");
	}

	private getAbsoluteLockFilePath(relativeLockFilePath: string) {
		return path.join(this.$settingsService.getProfileDir(), relativeLockFilePath);
	}

	private get defaultLockParams(): ILockOptions {
		// We'll retry 100 times and time between retries is 100ms, i.e. full wait in case we are unable to get lock will be 10 seconds.
		// In case lock is older than the `stale` value, consider it stale and try to get a new lock.
		const lockParams: ILockOptions = {
			retryWait: 100,
			retries: 100,
			stale: 30 * 1000,
		};

		return lockParams;
	}

	constructor(private $fs: IFileSystem,
		private $settingsService: ISettingsService,
		private $processService: IProcessService) {
		this.$processService.attachToProcessExitSignals(this, () => {
			const locksToRemove = _.clone(this.currentlyLockedFiles);
			_.each(locksToRemove, lock => {
				this.unlock(lock);
			});
		});
	}

	public async executeActionWithLock<T>(action: () => Promise<T>, lockFilePath?: string, lockOpts?: ILockOptions): Promise<T> {
		const resolvedLockFilePath = await this.lock(lockFilePath, lockOpts);

		try {
			const result = await action();
			return result;
		} finally {
			this.unlock(resolvedLockFilePath);
		}
	}

	public lock(lockFilePath?: string, lockOpts?: ILockOptions): Promise<string> {
		const { filePath, fileOpts } = this.getLockFileSettings(lockFilePath, lockOpts);
		this.currentlyLockedFiles.push(filePath);

		// Prevent ENOENT error when the dir, where lock should be created, does not exist.
		this.$fs.ensureDirectoryExists(path.dirname(filePath));

		return new Promise<string>((resolve, reject) => {
			lockfile.lock(filePath, fileOpts, (err: Error) => {
				err ? reject(new Error(`Timeout while waiting for lock "${filePath}"`)) : resolve(filePath);
			});
		});
	}

	public unlock(lockFilePath?: string): void {
		const { filePath } = this.getLockFileSettings(lockFilePath);
		_.remove(this.currentlyLockedFiles, e => e === lockFilePath);
		lockfile.unlockSync(filePath);
	}

	private getLockFileSettings(filePath?: string, fileOpts?: ILockOptions): { filePath: string, fileOpts: ILockOptions } {
		if (filePath && !path.isAbsolute(filePath)) {
			filePath = this.getAbsoluteLockFilePath(filePath);
		}

		filePath = filePath || this.defaultLockFilePath;
		fileOpts = fileOpts ? _.assign({}, this.defaultLockParams, fileOpts) : this.defaultLockParams;

		return {
			filePath,
			fileOpts
		};
	}
}

$injector.register("lockService", LockService);
// backwards compatibility
$injector.register("lockfile", LockService);
