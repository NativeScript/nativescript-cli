///<reference path=".d.ts"/>
"use strict";

import Future = require("fibers/future");
import lockfile = require("lockfile");
import * as path from "path";

export class LockFile implements ILockFile {
	private lockFilePath: string;
	
	constructor(private $options: IOptions) {
		this.lockFilePath = path.join(this.$options.profileDir, ".lock");
	}
	
	private static LOCK_EXPIRY_PERIOD_SEC = 180;
	private static LOCK_PARAMS = {
		retryWait: 100,
		retries: LockFile.LOCK_EXPIRY_PERIOD_SEC*10,
		stale: LockFile.LOCK_EXPIRY_PERIOD_SEC*1000
	};

	public lock(): IFuture<void> {
		let future = new Future<void>();
		lockfile.lock(this.lockFilePath, LockFile.LOCK_PARAMS, (err: Error) => {
			if(err) {
				future.throw(err);
			} else {
				future.return();
			}
		});
		return future;
	}

	public unlock(): IFuture<void> {
		let future = new Future<void>();
		lockfile.unlock(this.lockFilePath, (err: Error) => {
			if(err) {
				future.throw(err);
			} else {
				future.return();
			}
		});
		return future;
	}
}
$injector.register("lockfile", LockFile);
