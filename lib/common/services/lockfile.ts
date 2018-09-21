import * as lockfile from "lockfile";
import * as path from "path";
import { cache } from "../decorators";

export class LockFile implements ILockFile {

	@cache()
	private get defaultLockFilePath(): string {
		return path.join(this.$settingsService.getProfileDir(), "lockfile.lock");
	}

	private get defaultLockParams(): lockfile.Options {
		// We'll retry 100 times and time between retries is 100ms, i.e. full wait in case we are unable to get lock will be 10 seconds.
		// In case lock is older than 3 minutes, consider it stale and try to get a new lock.
		const lockParams: lockfile.Options = {
			retryWait: 100,
			retries: 100,
			stale: 180 * 1000,
		};

		return lockParams;
	}

	constructor(private $fs: IFileSystem,
		private $settingsService: ISettingsService) {
	}

	public lock(lockFilePath?: string, lockFileOpts?: lockfile.Options): Promise<void> {
		const { filePath, fileOpts } = this.getLockFileSettings(lockFilePath, lockFileOpts);

		// Prevent ENOENT error when the dir, where lock should be created, does not exist.
		this.$fs.ensureDirectoryExists(path.dirname(filePath));

		return new Promise<void>((resolve, reject) => {
			lockfile.lock(filePath, fileOpts, (err: Error) => {
				err ? reject(err) : resolve();
			});
		});
	}

	public unlock(lockFilePath?: string): void {
		const { filePath } = this.getLockFileSettings(lockFilePath);
		lockfile.unlockSync(filePath);
	}

	public check(lockFilePath?: string, lockFileOpts?: lockfile.Options): boolean {
		const { filePath, fileOpts } = this.getLockFileSettings(lockFilePath, lockFileOpts);

		return lockfile.checkSync(filePath, fileOpts);
	}

	private getLockFileSettings(filePath?: string, fileOpts?: lockfile.Options): { filePath: string, fileOpts: lockfile.Options } {
		filePath = filePath || this.defaultLockFilePath;
		fileOpts = fileOpts || this.defaultLockParams;

		return {
			filePath,
			fileOpts
		};
	}
}

$injector.register("lockfile", LockFile);
