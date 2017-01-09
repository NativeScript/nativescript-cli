import * as lockfile from "lockfile";
import * as path from "path";

export class LockFile implements ILockFile {
	private lockFilePath: string;

	constructor(private $options: IOptions) {
		this.lockFilePath = path.join(this.$options.profileDir, ".lock");
	}

	private static LOCK_EXPIRY_PERIOD_SEC = 180;
	private static LOCK_PARAMS = {
		retryWait: 100,
		retries: LockFile.LOCK_EXPIRY_PERIOD_SEC * 10,
		stale: LockFile.LOCK_EXPIRY_PERIOD_SEC * 1000
	};

	public lock(): void {
		lockfile.lockSync(this.lockFilePath, LockFile.LOCK_PARAMS);
	}

	public unlock(): void {
		lockfile.unlockSync(this.lockFilePath);
	}

	public check(): boolean {
		return lockfile.checkSync(this.lockFilePath, LockFile.LOCK_PARAMS);
	}
}

$injector.register("lockfile", LockFile);
